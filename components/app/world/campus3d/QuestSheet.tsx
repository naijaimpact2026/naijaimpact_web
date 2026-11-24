'use client'

import Link from 'next/link'
import { ChevronDown, Coins, Swords, Timer, Trophy, Users, Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { DISTRICTS } from '@/lib/world/districts'
import { QUEST_SLOT_LABEL, TOKENS_LABEL, XP_LABEL, type MissionView } from '@/lib/world/types'
import { DAY_LONG, STATUS_META } from '@/lib/world/ui'
import MissionPlayer from '../mission/MissionPlayer'
import { Stars } from './Stars'

/** Bottom sheet on phones, centred dialog on larger screens (shared by the Campus panels). */
export const SHEET_CLS = `flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl
    max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0
    max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:zoom-in-100`

/**
 * A quest, played inside the 3D Campus: the district's host says hello and
 * tells the story, then the activity runs right here (same MissionPlayer as
 * the mission page). Closing it drops the player back into the world.
 */
export default function QuestSheet({ slug, quest, color, onClose }: { slug: string; quest: MissionView | null; color: string; onClose: () => void })
{
    const base = `/app/competitions/${slug}`
    return (
        <Dialog open={quest !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className={SHEET_CLS}>
                {quest && <Body slug={slug} quest={quest} color={color} base={base} onClose={onClose} />}
            </DialogContent>
        </Dialog>
    )
}

function Body({ slug, quest: q, color, base, onClose }: { slug: string; quest: MissionView; color: string; base: string; onClose: () => void })
{
    const district = DISTRICTS.find((d) => d.key === q.district)
    const status = STATUS_META[q.status]
    const show = q.slot === 'show'
    const accent = show ? '#D97706' : color
    return (
        <>
            <DialogHeader className="shrink-0 space-y-0 border-b border-border px-5 pb-4 pt-5 pr-12 text-left" style={{ background: `linear-gradient(135deg, ${accent}1f 0%, transparent 70%)` }}>
                {/* Host */}
                <div className="flex items-end gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                    <img src={characterPreviewUrl(q.host.character)} alt="" className="hw-float -mb-1 h-16 w-16 shrink-0 object-contain drop-shadow-md sm:h-20 sm:w-20" />
                    <div className="relative mb-1 min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-foreground shadow-sm ring-1 ring-border">
                        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>{q.host.name} · {district?.label}</p>
                        <p className="leading-snug">{q.host.line}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: accent }}>
                        {show && <Swords className="h-3.5 w-3.5" />}{q.slot ? QUEST_SLOT_LABEL[q.slot] : 'Quest'} · {DAY_LONG[q.day - 1]}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}><status.icon className="h-3.5 w-3.5" />{status.label}</span>
                    <Stars n={q.stars} className="ml-auto" />
                </div>
                <DialogTitle className="mt-2 text-xl font-extrabold leading-tight">{q.title}</DialogTitle>
                <DialogDescription className="mt-1 text-sm">{q.story}</DialogDescription>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{q.estMinutes} min</span>
                    <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" />{q.xp} {XP_LABEL}</span>
                    <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-violet-500" />{q.tokens} {TOKENS_LABEL}</span>
                    {q.badge && <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />{q.badge.label} badge</span>}
                </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5">
                {q.tips.length > 0 && q.status !== 'locked' && (
                    <details className="group rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm" open={q.status === 'available' && q.slot !== 'play'}>
                        <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-foreground">
                            How to do it <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{q.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                    </details>
                )}
                <MissionPlayer
                    slug={slug}
                    mission={q}
                    attempts={q.lastAttempt ? [q.lastAttempt] : []}
                    color={accent}
                    homeHref={base}
                    onHome={onClose}
                />
                {show && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Link href={`${base}/squad`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"><Users className="h-3.5 w-3.5" /> My squad</Link>
                        <Link href={`${base}/leaderboard`} className="hw-press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"><Trophy className="h-3.5 w-3.5" /> Rankings</Link>
                    </div>
                )}
            </div>
        </>
    )
}
