import Link from 'next/link'
import { ArrowLeft, Gavel, Lock, PenSquare } from 'lucide-react'
import type { User } from '@/lib/types'
import { getCompetitionDetail, isAdmin, reviewCounts } from '@/lib/world/service'
import { TOKENS_LABEL, XP_LABEL } from '@/lib/world/types'
import WorldHome from './WorldHome'
import WorldOnboarding from './onboarding/WorldOnboarding'

/*
 * Web entry for a Hubnovo World competition (e.g. Campus):
 * not joined → Arrival Plaza onboarding; joined → player home.
 */
export default async function WorldCompetitionPage({ slug, profile, week }: { slug: string; profile: User | null; week?: number })
{
    const [detail, judging] = await Promise.all([
        profile ? getCompetitionDetail(slug, profile) : null,
        isAdmin(profile) ? reviewCounts(profile) : null,
    ])

    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
                <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Competitions
                </Link>
                {judging && (
                    <div className="flex items-center gap-2">
                    <Link href={`/app/competitions/${slug}/admin/content`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                        <PenSquare className="h-3.5 w-3.5 text-primary" /> Content
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
                <WorldHome competition={detail.competition} profile={profile} week={week} />
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
