import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { stageScores } from './progress'
import { semesterClock } from './schedule'
import { isAdmin, loadMissionRows, type Result } from './service'
import type { AttemptStatus, MissionKind, Pathway, ReviewMode } from './types'

/*
 * Admin analytics for a Hubnovo World competition (pilot health).
 * Read-only; computed on request from participants, attempts and the
 * token ledger. Large tables are read in pages (PostgREST returns at most
 * 1,000 rows per request).
 *
 * Definitions (keep in sync with the page's "How these are counted"):
 *  - joined      = a participant row with a pathway (onboarding saved)
 *  - finished onboarding = joined AND completed their Week 1 Day 1 mission
 *  - active in a week    = submitted at least one attempt that week
 *  - week-4 retention    = active in week 4 ÷ joined before week 4 started
 *  - stage complete      = stage 1 passed (score ≥ pass mark + finale passed)
 *  - started / submitted / passed per mission = students with an attempt /
 *    attempts in total / students who passed (mission opens aren't tracked)
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const DAY_MS = 86_400_000

export const PILOT_TARGETS = { onboarding: 70, week4: 40, stage: 25 } as const

export interface Rate { count: number; of: number; pct: number | null }

export interface AnalyticsView
{
    generatedAt: string
    clock: { week: number | null; day: number | null; phase: 'upcoming' | 'running' | 'ended' }
    joined: { total: number; career: number; enterprise: number }
    signupsByDay: { date: string; career: number; enterprise: number }[]
    bySchool: { institutionId: string | null; name: string; career: number; enterprise: number; total: number }[]
    onboarding: Rate
    activeThisWeek: Rate
    /** null until week 4 has started. */
    week4: Rate | null
    /** Stage 1 complete; null until stage 1 has ended (week 4 Sunday). */
    stage: Rate | null
    missions: { id: string; pathway: Pathway; week: number; day: number; title: string; kind: MissionKind; reviewMode: ReviewMode; started: number; submitted: number; passed: number }[]
    review: { queue: number; avgWaitHours: number | null; avgTurnaroundHours: number | null; appeals: number }
    tokens: { earned: number; redeemed: number; refunded: number }
    targets: typeof PILOT_TARGETS
}

const rate = (count: number, of: number): Rate => ({ count, of, pct: of > 0 ? Math.round((count / of) * 1000) / 10 : null })

/** All rows of a query, 1,000 at a time (hard cap keeps a runaway query bounded). */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>, cap = 200_000): Promise<T[]>
{
    const out: T[] = []
    for (let from = 0; from < cap; from += 1000)
    {
        const { data, error } = await build(from, from + 999)
        if (error) throw new Error(error.message)
        const rows = (data ?? []) as T[]
        out.push(...rows)
        if (rows.length < 1000) break
    }
    return out
}

/** YYYY-MM-DD in Lagos time (UTC+1, no DST). */
const lagosDay = (iso: string) => new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10)

export async function competitionAnalytics(slug: string, profile: User): Promise<Result<{ analytics: AnalyticsView }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const db = createServiceClient()
    const { data: comp } = await db.from('competitions').select('id, slug, format, weeks, season_start, season_end').eq('slug', slug).maybeSingle()
    if (!comp || comp.format !== 'world') return fail('Competition not found.')
    const c = comp as { id: string; weeks: number; season_start: string | null; season_end: string | null }
    const clock = semesterClock(c.season_start, c.season_end, c.weeks)
    const start = c.season_start ? new Date(c.season_start).getTime() : null
    const weekStart = (w: number) => start! + (w - 1) * 7 * DAY_MS

    try
    {
        type P = { user_id: string; pathway: Pathway; institution_id: string | null; joined_at: string }
        type A = { user_id: string; mission_id: string; status: AttemptStatus; score: number | null; attempt_no: number; created_at: string; reviewed_at: string | null; appeal_status: string | null }
        type T = { amount: number; source: string }
        const [parts, attempts, missions, tokens] = await Promise.all([
            fetchAll<P>((f, t) => db.from('competition_participants').select('user_id, pathway, institution_id, joined_at').eq('competition_id', c.id).not('pathway', 'is', null).order('joined_at').range(f, t)),
            fetchAll<A>((f, t) => db.from('competition_attempts').select('user_id, mission_id, status, score, attempt_no, created_at, reviewed_at, appeal_status').eq('competition_id', c.id).order('created_at').range(f, t)),
            loadMissionRows(c.id),
            fetchAll<T>((f, t) => db.from('hub_token_events').select('amount, source').eq('competition_id', c.id).order('created_at').range(f, t)),
        ])

        // ── Sign-ups ──
        const joined = { total: parts.length, career: parts.filter((p) => p.pathway === 'career').length, enterprise: parts.filter((p) => p.pathway === 'enterprise').length }
        const days = new Map<string, { career: number; enterprise: number }>()
        for (const p of parts)
        {
            const d = lagosDay(p.joined_at)
            const x = days.get(d) ?? { career: 0, enterprise: 0 }
            x[p.pathway]++
            days.set(d, x)
        }
        // Fill gaps so the chart has one bar per day (last 90 days at most).
        const signupsByDay: AnalyticsView['signupsByDay'] = []
        if (parts.length)
        {
            const first = Math.max(new Date(`${lagosDay(parts[0].joined_at)}T00:00:00Z`).getTime(), Date.now() - 89 * DAY_MS)
            for (let t = first; t <= Date.now() + DAY_MS; t += DAY_MS)
            {
                const d = new Date(t).toISOString().slice(0, 10)
                if (d > lagosDay(new Date().toISOString())) break
                signupsByDay.push({ date: d, ...(days.get(d) ?? { career: 0, enterprise: 0 }) })
            }
        }

        const schools = new Map<string | null, { career: number; enterprise: number }>()
        for (const p of parts)
        {
            const x = schools.get(p.institution_id) ?? { career: 0, enterprise: 0 }
            x[p.pathway]++
            schools.set(p.institution_id, x)
        }
        const instIds = [...schools.keys()].filter((k): k is string => Boolean(k))
        const names = new Map<string, string>()
        for (let i = 0; i < instIds.length; i += 200)
        {
            const { data } = await db.from('institutions').select('id, name, short_name').in('id', instIds.slice(i, i + 200))
            for (const r of (data ?? []) as { id: string; name: string; short_name: string | null }[]) names.set(r.id, r.short_name ? `${r.short_name} · ${r.name}` : r.name)
        }
        const bySchool = [...schools.entries()]
            .map(([id, x]) => ({ institutionId: id, name: id ? names.get(id) ?? 'Unknown campus' : 'No campus given', career: x.career, enterprise: x.enterprise, total: x.career + x.enterprise }))
            .sort((a, b) => b.total - a.total)

        // ── Onboarding / activity ──
        const joinedIds = new Set(parts.map((p) => p.user_id))
        const firstMission = new Map(missions.filter((m) => m.week === 1 && m.day === 1).map((m) => [m.pathway, m.id]))
        const passedSet = new Set(attempts.filter((a) => a.status === 'passed').map((a) => `${a.user_id}:${a.mission_id}`))
        const onboarded = parts.filter((p) => { const m = firstMission.get(p.pathway); return m && passedSet.has(`${p.user_id}:${m}`) }).length

        const activeIn = (from: number, to: number) =>
            new Set(attempts.filter((a) => { const t = new Date(a.created_at).getTime(); return t >= from && t < to && joinedIds.has(a.user_id) }).map((a) => a.user_id)).size
        const activeThisWeek = clock.phase === 'running' && clock.week && start !== null
            ? rate(activeIn(weekStart(clock.week), weekStart(clock.week) + 7 * DAY_MS), joined.total) : rate(0, joined.total)

        let week4: Rate | null = null
        if (start !== null && Date.now() >= weekStart(4))
        {
            const cohort = parts.filter((p) => new Date(p.joined_at).getTime() < weekStart(4))
            const cohortIds = new Set(cohort.map((p) => p.user_id))
            const active = new Set(attempts.filter((a) => { const t = new Date(a.created_at).getTime(); return t >= weekStart(4) && t < weekStart(5) && cohortIds.has(a.user_id) }).map((a) => a.user_id)).size
            week4 = rate(active, cohort.length)
        }

        let stage: Rate | null = null
        if (start !== null && Date.now() >= weekStart(5))
        {
            const byUser = new Map<string, A[]>()
            for (const a of attempts) { const l = byUser.get(a.user_id); if (l) l.push(a); else byUser.set(a.user_id, [a]) }
            let done = 0
            for (const p of parts)
            {
                const pathMissions = missions.filter((m) => m.pathway === p.pathway && m.stage === 1)
                const s = stageScores(pathMissions, byUser.get(p.user_id) ?? [])[0]
                if (s?.passed) done++
            }
            stage = rate(done, joined.total)
        }

        // ── Per mission ──
        const perMission = new Map<string, { users: Set<string>; submitted: number; passed: Set<string> }>()
        for (const a of attempts)
        {
            const x = perMission.get(a.mission_id) ?? { users: new Set(), submitted: 0, passed: new Set() }
            x.users.add(a.user_id); x.submitted++
            if (a.status === 'passed') x.passed.add(a.user_id)
            perMission.set(a.mission_id, x)
        }
        const missionRows = missions
            .filter((m) => start === null || weekStart(m.week) + (m.day - 1) * DAY_MS <= Date.now())
            .map((m) =>
            {
                const x = perMission.get(m.id)
                return { id: m.id, pathway: m.pathway, week: m.week, day: m.day, title: m.title, kind: m.kind, reviewMode: m.review_mode, started: x?.users.size ?? 0, submitted: x?.submitted ?? 0, passed: x?.passed.size ?? 0 }
            })
            .sort((a, b) => a.week - b.week || a.day - b.day || a.pathway.localeCompare(b.pathway))

        // ── Review queue ──
        const inReview = attempts.filter((a) => a.status === 'in_review')
        const now = Date.now()
        const avgWaitHours = inReview.length ? Math.round(inReview.reduce((s, a) => s + (now - new Date(a.created_at).getTime()), 0) / inReview.length / 360_000) / 10 : null
        const humanIds = new Set(missions.filter((m) => m.review_mode === 'human').map((m) => m.id))
        const judged = attempts.filter((a) => humanIds.has(a.mission_id) && a.reviewed_at && now - new Date(a.reviewed_at).getTime() < 14 * DAY_MS && a.status !== 'in_review')
        const avgTurnaroundHours = judged.length ? Math.round(judged.reduce((s, a) => s + (new Date(a.reviewed_at!).getTime() - new Date(a.created_at).getTime()), 0) / judged.length / 360_000) / 10 : null

        // ── Tokens ──
        const sum = (src: string) => tokens.filter((t) => t.source === src).reduce((s, t) => s + t.amount, 0)

        return {
            ok: true,
            analytics: {
                generatedAt: new Date().toISOString(),
                clock: { week: clock.week, day: clock.day, phase: clock.phase },
                joined, signupsByDay, bySchool,
                onboarding: rate(onboarded, joined.total),
                activeThisWeek, week4, stage,
                missions: missionRows,
                review: { queue: inReview.length, avgWaitHours, avgTurnaroundHours, appeals: attempts.filter((a) => a.appeal_status === 'open').length },
                tokens: { earned: sum('mission'), redeemed: -sum('redemption'), refunded: sum('reversal') },
                targets: PILOT_TARGETS,
            },
        }
    } catch (e)
    {
        console.error('world analytics failed:', e instanceof Error ? e.message : e)
        return fail('Could not load analytics. Please try again.')
    }
}
