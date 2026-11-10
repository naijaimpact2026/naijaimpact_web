import Link from 'next/link'
import { ArrowLeft, Briefcase, Lightbulb, Lock, ShieldCheck } from 'lucide-react'
import type { User } from '@/lib/types'
import { getCompetitionDetail, isAdmin } from '@/lib/world/service'
import { TOKENS_LABEL, XP_LABEL } from '@/lib/world/types'
import WorldAdminPanel from './WorldAdminPanel'

/*
 * Web entry for a Hubnovo World competition (e.g. Campus). The player
 * screens (onboarding, daily quest, passport, rewards) are built on the
 * /api/competitions endpoints; until they land this page shows the
 * pathways, and admins get the content/tester tools.
 */
export default async function WorldCompetitionPage({ slug, profile }: { slug: string; profile: User | null })
{
    const detail = profile ? await getCompetitionDetail(slug, profile) : null
    const admin = isAdmin(profile)

    if (!detail || !detail.ok)
    {
        return (
            <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-4">
                <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Competitions
                </Link>
                <section className="rounded-3xl border border-border bg-card p-8 text-center space-y-3">
                    <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h1 className="text-lg font-bold text-foreground">Campus Competition — coming soon</h1>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        Two pathways — Career & Employability and Enterprise Development — with daily quests, weekly boss challenges, {XP_LABEL}, {TOKENS_LABEL} and a campus league.
                    </p>
                </section>
            </div>
        )
    }

    const c = detail.competition
    const icons = { career: Briefcase, enterprise: Lightbulb }
    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Competitions
            </Link>

            <section className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1D8F 0%, #102A43 60%, #00688A 100%)' }}>
                <div className="space-y-2 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                        {c.status === 'preview' ? <><ShieldCheck className="h-3 w-3" /> Preview — testers only</> : c.seasonName}
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{c.name}</h1>
                    {c.tagline && <p className="text-sm sm:text-base text-white/85">{c.tagline}</p>}
                    <p className="text-xs text-white/70">
                        {c.clock.phase === 'running' ? `Week ${c.clock.week} · Day ${c.clock.day} · Stage ${c.clock.stage}` : c.clock.phase === 'upcoming' ? 'Starts soon' : 'Semester ended'}
                        {' · '}{c.participants.toLocaleString('en-NG')} joined
                    </p>
                </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
                {c.pathways.map((p) =>
                {
                    const Icon = icons[p.key]
                    return (
                        <div key={p.key} className="rounded-3xl border border-border bg-card p-5 space-y-2">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${p.color}22`, color: p.color }}><Icon className="h-5 w-5" /></span>
                            <h2 className="text-base font-bold text-foreground">{p.name}</h2>
                            {p.tagline && <p className="text-sm text-muted-foreground">{p.tagline}</p>}
                            {c.me?.pathway === p.key && <p className="text-xs font-bold text-emerald-600">You’re on this pathway</p>}
                        </div>
                    )
                })}
            </div>

            <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                The player experience (onboarding, daily quests, passport and rewards) is being built on the Hubnovo World API and will appear here and in the mobile app.
            </p>

            {admin && <WorldAdminPanel slug={slug} />}
        </div>
    )
}
