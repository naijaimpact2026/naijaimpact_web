import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { notifyWorld } from './notify'
import { isAdmin, loadParticipant, playableWorld, type Result } from './service'
import type { AttemptStatus, MissionKind } from './types'
import { REPORT_REASONS, type ReportInput, type ReportReason, type ReportStatus } from './report-reasons'

export { REPORT_REASONS, type ReportInput, type ReportReason, type ReportStatus }

/*
 * Player reports (competition_reports, migration 20261113110000). Students
 * report another player from the leaderboard or their squad; admins handle
 * them on the judging page (Reports tab): dismiss, or reject one of the
 * player's attempts with a note.
 *
 * Rejecting an attempt sets it to 'rejected' (it stops counting towards
 * stage scores and certificates) and notifies the student, who can appeal.
 * XP/HubTokens already awarded stay in the append-only ledgers.
 *
 * Until the migration runs, reporting answers "not switched on yet".
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const NOT_FOUND = 'Competition not found.'
const OFF = 'Reporting is not switched on yet.'
const missingTable = (e: { code?: string; message?: string } | null) =>
    Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message ?? '')))
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const REASON_IDS = REPORT_REASONS.map((r) => r.id)

/** Reports one student can send per day (stops floods). */
const DAILY_LIMIT = 10


export async function reportPlayer(slug: string, profile: User, input: ReportInput): Promise<Result>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    if (!input || !UUID.test(input.targetUserId ?? '')) return fail('Choose who you’re reporting.')
    if (input.targetUserId === profile.id) return fail('You can’t report yourself.')
    if (!REASON_IDS.includes(input.reason)) return fail('Choose a reason.')
    const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : ''
    if (input.reason === 'other' && note.length < 5) return fail('Tell us what happened in the note.')
    if (!(await loadParticipant(c.id, profile.id))) return fail('Join the competition first.')
    if (!(await loadParticipant(c.id, input.targetUserId))) return fail('That player isn’t in this competition.')

    const db = createServiceClient()
    let attemptId: string | null = null
    if (input.attemptId)
    {
        if (!UUID.test(input.attemptId)) return fail('That submission wasn’t found.')
        const { data } = await db.from('competition_attempts').select('id').eq('id', input.attemptId).eq('competition_id', c.id).eq('user_id', input.targetUserId).maybeSingle()
        if (!data) return fail('That submission wasn’t found.')
        attemptId = data.id
    }

    const since = new Date(Date.now() - 86_400_000).toISOString()
    const { count, error: cErr } = await db.from('competition_reports').select('id', { count: 'exact', head: true }).eq('reporter_id', profile.id).gte('created_at', since)
    if (cErr) return fail(missingTable(cErr) ? OFF : 'Could not send your report. Please try again.')
    if ((count ?? 0) >= DAILY_LIMIT) return fail('You’ve sent a lot of reports today. Please try again tomorrow.')

    const context = ['leaderboard', 'squad', 'attempt', 'other'].includes(input.context ?? '') ? input.context : null
    const { error } = await db.from('competition_reports').insert({
        competition_id: c.id, reporter_id: profile.id, target_user_id: input.targetUserId, attempt_id: attemptId,
        reason: input.reason, note: note || null, context,
    })
    if (error)
    {
        // Already an open report from this student about this player: treat as sent.
        if (error.code === '23505') return { ok: true }
        return fail(missingTable(error) ? OFF : 'Could not send your report. Please try again.')
    }
    return { ok: true }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

type UserLite = { id: string; username: string | null; displayName: string | null; avatarUrl: string | null }

export interface ReportAttempt
{
    id: string
    missionId: string
    missionTitle: string
    kind: MissionKind | null
    week: number | null
    day: number | null
    status: AttemptStatus
    score: number | null
    createdAt: string
}

export interface ReportItem
{
    id: string
    competition: string
    reason: ReportReason
    note: string | null
    context: string | null
    status: ReportStatus
    createdAt: string
    handledAt: string | null
    resolution: string | null
    reporter: UserLite
    target: UserLite
    /** The attempt the report is about (if any). */
    attempt: ReportAttempt | null
    /** The player's latest attempts, so an admin can reject one even when the report names none. */
    recentAttempts: ReportAttempt[]
    /** Open reports about this player in total (repeat offenders stand out). */
    openAboutTarget: number
}

export async function countOpenReports(): Promise<number>
{
    const { count, error } = await createServiceClient().from('competition_reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
    return error ? 0 : count ?? 0
}

export async function listReports(profile: User, opts: { status?: string; limit?: number } = {}): Promise<Result<{ enabled: boolean; reports: ReportItem[]; open: number }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const status: ReportStatus = opts.status === 'actioned' || opts.status === 'dismissed' ? opts.status : 'open'
    const db = createServiceClient()
    const { data, error } = await db.from('competition_reports')
        .select('id, reason, note, context, status, created_at, handled_at, resolution, reporter_id, target_user_id, attempt_id, competition:competitions(slug)')
        .eq('status', status).order('created_at', { ascending: status === 'open' }).limit(Math.min(opts.limit ?? 100, 200))
    if (error) return missingTable(error) ? { ok: true, enabled: false, reports: [], open: 0 } : fail('Could not load reports.')
    type Row = { id: string; reason: ReportReason; note: string | null; context: string | null; status: ReportStatus; created_at: string; handled_at: string | null; resolution: string | null; reporter_id: string; target_user_id: string; attempt_id: string | null; competition: { slug: string } | null }
    const rows = (data ?? []) as unknown as Row[]
    const open = await countOpenReports()
    if (rows.length === 0) return { ok: true, enabled: true, reports: [], open }

    const userIds = [...new Set(rows.flatMap((r) => [r.reporter_id, r.target_user_id]))]
    const targets = [...new Set(rows.map((r) => r.target_user_id))]
    const [{ data: users }, { data: attempts }, { data: openRows }] = await Promise.all([
        db.from('users').select('id, username, display_name, avatar_url').in('id', userIds),
        db.from('competition_attempts').select('id, user_id, mission_id, status, score, created_at').in('user_id', targets).order('created_at', { ascending: false }).limit(targets.length * 20),
        db.from('competition_reports').select('target_user_id').eq('status', 'open').in('target_user_id', targets),
    ])
    // Attempts named by a report may be older than the recent ones.
    const named = rows.map((r) => r.attempt_id).filter((id): id is string => Boolean(id))
    type ARow = { id: string; user_id: string; mission_id: string; status: AttemptStatus; score: number | null; created_at: string }
    let allAttempts = (attempts ?? []) as ARow[]
    const missingNamed = named.filter((id) => !allAttempts.some((a) => a.id === id))
    if (missingNamed.length)
    {
        const { data: extra } = await db.from('competition_attempts').select('id, user_id, mission_id, status, score, created_at').in('id', missingNamed)
        allAttempts = [...allAttempts, ...((extra ?? []) as ARow[])]
    }
    const missionIds = [...new Set(allAttempts.map((a) => a.mission_id))]
    const { data: missions } = missionIds.length ? await db.from('competition_missions').select('id, title, kind, week, day').in('id', missionIds) : { data: [] }
    const mm = new Map(((missions ?? []) as { id: string; title: string; kind: MissionKind | null; week: number | null; day: number | null }[]).map((m) => [m.id, m]))
    const uu = new Map(((users ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[])
        .map((u) => [u.id, { id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url }]))
    const openCount: Record<string, number> = {}
    for (const r of (openRows ?? []) as { target_user_id: string }[]) openCount[r.target_user_id] = (openCount[r.target_user_id] ?? 0) + 1
    const toAttempt = (a: ARow): ReportAttempt =>
    {
        const m = mm.get(a.mission_id)
        return { id: a.id, missionId: a.mission_id, missionTitle: m?.title ?? 'Mission', kind: m?.kind ?? null, week: m?.week ?? null, day: m?.day ?? null, status: a.status, score: a.score === null ? null : Number(a.score), createdAt: a.created_at }
    }
    const blank = (id: string): UserLite => ({ id, username: null, displayName: null, avatarUrl: null })

    return {
        ok: true, enabled: true, open,
        reports: rows.map((r) =>
        {
            const named = r.attempt_id ? allAttempts.find((a) => a.id === r.attempt_id) : undefined
            return {
                id: r.id, competition: r.competition?.slug ?? 'campus', reason: r.reason, note: r.note, context: r.context, status: r.status,
                createdAt: r.created_at, handledAt: r.handled_at, resolution: r.resolution,
                reporter: uu.get(r.reporter_id) ?? blank(r.reporter_id), target: uu.get(r.target_user_id) ?? blank(r.target_user_id),
                attempt: named ? toAttempt(named) : null,
                recentAttempts: allAttempts.filter((a) => a.user_id === r.target_user_id).slice(0, 8).map(toAttempt),
                openAboutTarget: openCount[r.target_user_id] ?? 0,
            }
        }),
    }
}

export interface HandleReportInput
{
    reportId: string
    action: 'dismiss' | 'reject_attempt'
    /** For reject_attempt: defaults to the attempt named in the report. */
    attemptId?: string | null
    /** Dismiss: internal note. Reject: feedback shown to the student. */
    note: string
}

/** Dismiss a report, or reject one of the reported player's attempts (status → actioned). */
export async function handleReport(profile: User, input: HandleReportInput): Promise<Result<{ status: ReportStatus }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    if (!input || !UUID.test(input.reportId ?? '')) return fail('Report not found.')
    const note = typeof input.note === 'string' ? input.note.trim().slice(0, 2000) : ''
    const db = createServiceClient()
    const { data: rep, error } = await db.from('competition_reports').select('id, status, target_user_id, attempt_id, competition_id, competition:competitions(slug)').eq('id', input.reportId).maybeSingle()
    if (error) return fail(missingTable(error) ? OFF : 'Could not load the report.')
    if (!rep) return fail('Report not found.')
    const report = rep as unknown as { id: string; status: ReportStatus; target_user_id: string; attempt_id: string | null; competition_id: string; competition: { slug: string } | null }
    if (report.status !== 'open') return fail('This report was already handled.')
    const now = new Date().toISOString()

    if (input.action === 'dismiss')
    {
        const { data } = await db.from('competition_reports').update({ status: 'dismissed', handled_by: profile.id, handled_at: now, resolution: note || null })
            .eq('id', report.id).eq('status', 'open').select('id').maybeSingle()
        return data ? { ok: true, status: 'dismissed' } : fail('This report was already handled.')
    }
    if (input.action !== 'reject_attempt') return fail('Choose dismiss or reject.')

    const attemptId = input.attemptId || report.attempt_id
    if (!attemptId || !UUID.test(attemptId)) return fail('Choose the submission to reject.')
    if (note.length < 5) return fail('Add a note for the student explaining why.')
    const { data: att } = await db.from('competition_attempts').select('id, mission_id, status, user_id').eq('id', attemptId)
        .eq('user_id', report.target_user_id).eq('competition_id', report.competition_id).maybeSingle()
    if (!att) return fail('That submission isn’t from the reported player.')
    if (att.status === 'rejected') return fail('That submission is already rejected.')

    const { error: upErr } = await db.from('competition_attempts')
        .update({ status: 'rejected', feedback: note, reviewer_id: profile.id, reviewed_at: now })
        .eq('id', att.id)
    if (upErr) return fail('Could not reject the submission.')
    // Every open report about this attempt is handled by the same decision.
    await db.from('competition_reports').update({ status: 'actioned', handled_by: profile.id, handled_at: now, resolution: note })
        .eq('status', 'open').or(`id.eq.${report.id},attempt_id.eq.${att.id}`)

    const { data: m } = await db.from('competition_missions').select('title').eq('id', att.mission_id).maybeSingle()
    const slug = report.competition?.slug ?? 'campus'
    await notifyWorld([{
        userId: att.user_id, actorId: profile.id, referenceId: att.id, referenceType: 'world_attempt',
        title: `Not accepted: ${(m as { title: string } | null)?.title ?? 'your submission'}`,
        body: `A moderator reviewed this submission. ${note} You can appeal if you think it’s wrong.`,
        url: `/app/competitions/${slug}/missions/${att.mission_id}`,
    }])
    return { ok: true, status: 'actioned' }
}
