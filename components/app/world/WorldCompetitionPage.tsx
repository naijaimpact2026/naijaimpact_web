import Link from 'next/link'
import { ArrowLeft, BarChart3, Gavel, Lock, PenSquare } from 'lucide-react'
import type { User } from '@/lib/types'
import { getCompetitionDetail, getProgress, isAdmin, listQuests, reviewCounts, todayQuests } from '@/lib/world/service'
import { getTodayDrop } from '@/lib/world/drops'
import { squadSummary } from '@/lib/world/squads'
import { DISTRICTS, type DistrictKey } from '@/lib/world/districts'
import { STAGE_WEEKS, TOKENS_LABEL, XP_LABEL, type CompetitionDetail } from '@/lib/world/types'
import { calmMotion } from '@/lib/world/ui'
import CampusHome from './campus3d/CampusHome'
import WorldOnboarding from './onboarding/WorldOnboarding'

/*
 * Web entry for a Hubnovo World competition (e.g. Campus):
 * not joined → Arrival Plaza onboarding; joined → the 3D Campus is the home.
 */
export default async function WorldCompetitionPage({ slug, profile, week, district, quest }: { slug: string; profile: User | null; week?: number; district?: string; quest?: string })
{
    const [detail, judging] = await Promise.all([
        profile ? getCompetitionDetail(slug, profile) : null,
        isAdmin(profile) ? reviewCounts(profile) : null,
    ])
    const joined = Boolean(detail?.ok && detail.competition.me && profile)

    return (
        <div className={`w-full ${joined ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 ${joined ? 'space-y-3' : 'space-y-5'}`}>
            <div className="flex items-center justify-between gap-3">
                <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Competitions
                </Link>
                {judging && (
                    <div className="flex items-center gap-2">
                    <Link href={`/app/competitions/${slug}/admin/content`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                        <PenSquare className="h-3.5 w-3.5 text-primary" /> Content
                    </Link>
                    <Link href={`/app/competitions/${slug}/admin/analytics`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" /> Analytics
                    </Link>
                    <Link href="/app/competitions/judging" className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                        <Gavel className="h-3.5 w-3.5 text-primary" /> Judging
                        {judging.inReview + judging.appeals > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] tabular-nums text-primary-foreground">{judging.inReview + judging.appeals}</span>}
                    </Link>
                    </div>
                )}
            </div>

            {!detail || !detail.ok || !profile ? (
                <section className="rounded-3xl border border-border bg-card p-8 text-center space-y-3">
                    <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h1 className="text-lg font-bold text-foreground">Campus Competition is coming soon</h1>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        Two pathways, Career & Employability and Enterprise Development, with daily quests, weekly boss challenges, {XP_LABEL}, {TOKENS_LABEL} and a campus league.
                    </p>
                </section>
            ) : detail.competition.me ? (
                <CampusHomeLoader competition={detail.competition} profile={profile} week={week} district={district} quest={quest} />
            ) : (
                <>
                    <section className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1D8F 0%, #102A43 60%, #00688A 100%)' }}>
                        <div className="max-w-2xl space-y-2">
                            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">{detail.competition.seasonName ?? 'Semester'}</span>
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{detail.competition.name}</h1>
                            {detail.competition.tagline && <p className="text-sm sm:text-base text-white/85">{detail.competition.tagline}</p>}
                            <p className="text-xs text-white/70">{detail.competition.participants.toLocaleString('en-NG')} joined · {detail.competition.weeks} weeks</p>
                        </div>
                    </section>
                    <WorldOnboarding slug={slug} pathways={detail.competition.pathways} competitionName={detail.competition.name} />
                </>
            )}
        </div>
    )
}

/** Loads everything the 3D Campus home needs in one go. */
async function CampusHomeLoader({ competition: c, profile, week, district, quest }: { competition: CompetitionDetail; profile: User; week?: number; district?: string; quest?: string })
{
    const me = c.me!
    const pathway = c.pathways.find((p) => p.key === me.pathway)!
    const [progressRes, todayRes, weekRes, squad, dropRes] = await Promise.all([
        getProgress(c.slug, profile),
        todayQuests(c.slug, profile),
        listQuests(c.slug, profile, week),
        squadSummary(c.id, profile.id),
        getTodayDrop(c.slug, profile),
    ])
    const progress = progressRes.ok ? progressRes.progress : null
    const shownWeek = weekRes.ok ? weekRes.week ?? 1 : 1
    // Only the three weekly quests (older off-day missions are being retired).
    const quests = (weekRes.ok ? weekRes.missions : []).filter((m) => m.slot !== null).sort((a, b) => a.day - b.day)
    const catchUp = (todayRes.ok ? todayRes.catchUp : []).filter((m) => m.slot !== null && m.week !== shownWeek)
    const stage = progress?.stages.find((s) => s.stage === (c.clock.stage ?? 1)) ?? progress?.stages[0] ?? null
    const initialDistrict = DISTRICTS.some((d) => d.key === district) ? (district as DistrictKey) : null

    return (
        <div className={calmMotion(me) ? 'hw-reduce' : ''}>
            <CampusHome
                slug={c.slug}
                pathway={{ key: pathway.key, name: pathway.name, color: pathway.color }}
                participant={me}
                me={{
                    displayName: profile.display_name ?? profile.username ?? 'You',
                    pathwayName: pathway.name,
                    institution: me.institution ? me.institution.shortName ?? me.institution.name : null,
                    character: me.avatar.character,
                    level: progress?.level ?? { level: 1, name: 'Newcomer', xpToNext: 0, progress: 0 },
                    xp: progress?.xp ?? 0,
                    tokens: progress?.tokens ?? 0,
                    rank: progress?.rank ?? null,
                    streak: progress?.streak ?? 0,
                    badges: progress?.badges.length ?? 0,
                    stage,
                    finaleWeek: (stage?.stage ?? 1) * STAGE_WEEKS,
                }}
                week={shownWeek}
                currentWeek={c.clock.week}
                totalWeeks={c.weeks}
                quests={quests}
                catchUp={catchUp}
                drop={dropRes.ok ? dropRes.drop : null}
                squad={squad}
                lite={Boolean(me.accessibility.lite)}
                initialDistrict={initialDistrict}
                initialQuest={quest ?? null}
            />
        </div>
    )
}
