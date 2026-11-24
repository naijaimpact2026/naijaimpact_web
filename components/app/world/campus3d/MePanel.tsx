'use client'

import Link from 'next/link'
import { Award, CalendarDays, Coins, Flame, Gamepad2, IdCard, Medal, Sparkles, Star, Swords, Wrench } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { TOKENS_LABEL, XP_LABEL, type StageScore, type WorldParticipantView } from '@/lib/world/types'
import { AnimatedBar } from '../fx'
import WorldSettings from '../settings/WorldSettings'
import { SHEET_CLS } from './QuestSheet'

export interface MeSummary
{
    displayName: string
    pathwayName: string
    institution: string | null
    character: number
    level: { level: number; name: string; xpToNext: number; progress: number }
    xp: number
    tokens: number
    rank: number | null
    streak: number
    badges: number
    stage: StageScore | null
    finaleWeek: number
}

/** "Me": who you are, your level and stars, and everything that used to crowd the home page. */
export default function MePanel({ slug, open, onClose, me, participant, color }: {
    slug: string; open: boolean; onClose: () => void; me: MeSummary; participant: WorldParticipantView; color: string
})
{
    const base = `/app/competitions/${slug}`
    const s = me.stage
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className={SHEET_CLS}>
                <DialogHeader className="shrink-0 px-5 pb-4 pt-5 pr-12 text-left text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                    <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                        <img src={characterPreviewUrl(me.character)} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-white/15 object-contain p-1" />
                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{me.pathwayName}{me.institution ? ` · ${me.institution}` : ''}</p>
                            <DialogTitle className="truncate text-xl font-extrabold text-white">{me.displayName}</DialogTitle>
                            <DialogDescription className="text-xs font-semibold text-white/85">Level {me.level.level} · {me.level.name}{me.rank ? ` · #${me.rank} on your pathway` : ''}</DialogDescription>
                            <AnimatedBar pct={me.level.progress * 100} color="#ffffff" track="bg-white/20" className="h-1.5 max-w-xs" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        <Stat icon={Sparkles} value={me.xp.toLocaleString('en-NG')} label={XP_LABEL} />
                        <Stat icon={Coins} value={me.tokens.toLocaleString('en-NG')} label={TOKENS_LABEL} />
                        <Stat icon={Flame} value={String(me.streak)} label="day streak" />
                        <Stat icon={Medal} value={String(me.badges)} label="badges" />
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                    {s && (
                        <section className="rounded-2xl border border-border p-4">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-sm font-bold text-foreground">Stage {s.stage} stars</p>
                                <p className="inline-flex items-center gap-1 text-lg font-extrabold tabular-nums text-foreground"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{s.stars}<span className="text-sm font-semibold text-muted-foreground">/{s.maxStars}</span></p>
                            </div>
                            <AnimatedBar pct={s.maxStars ? (s.stars / s.maxStars) * 100 : 0} color={s.stars >= s.starsToPass ? '#16A34A' : '#F59E0B'} className="mt-2 h-2" />
                            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                <li className={s.stars >= s.starsToPass ? 'font-semibold text-emerald-700 dark:text-emerald-300' : ''}>{s.stars >= s.starsToPass ? '✓' : '○'} {s.starsToPass} stars to pass ({s.passMark}%)</li>
                                <li className={s.finalePassed ? 'font-semibold text-emerald-700 dark:text-emerald-300' : ''}>{s.finalePassed ? '✓' : '○'} Pass the Week {me.finaleWeek} finale (judged)</li>
                            </ul>
                            <p className="mt-2 text-[11px] text-muted-foreground">Pass both and your Stage {s.stage} certificate unlocks.</p>
                        </section>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Link href={`${base}/passport`} className="hw-press flex items-center gap-2 rounded-2xl border border-border p-3 text-sm font-bold text-foreground hover:bg-muted"><IdCard className="h-4 w-4" style={{ color }} /> My Passport</Link>
                        <Link href={`${base}/certificates`} className="hw-press flex items-center gap-2 rounded-2xl border border-border p-3 text-sm font-bold text-foreground hover:bg-muted"><Award className="h-4 w-4 text-amber-500" /> Certificates</Link>
                    </div>

                    <section className="space-y-2 rounded-2xl bg-muted/50 px-4 py-3">
                        <p className="text-sm font-bold text-foreground">How it works</p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li className="flex gap-2"><Gamepad2 className="h-4 w-4 shrink-0 text-sky-600" /><span><b className="text-foreground">Play</b> on Monday: a quick game in the Learning Academy, marked instantly.</span></li>
                            <li className="flex gap-2"><Wrench className="h-4 w-4 shrink-0" style={{ color }} /><span><b className="text-foreground">Do</b> on Wednesday: one real-world task at your HQ. Upload proof and write one line.</span></li>
                            <li className="flex gap-2"><Swords className="h-4 w-4 shrink-0 text-amber-600" /><span><b className="text-foreground">Show</b> on Sunday: your showcase in the Arena, scored by judges.</span></li>
                            <li className="flex gap-2"><Sparkles className="h-4 w-4 shrink-0 text-amber-500" /><span>Every day a <b className="text-foreground">drop</b> lands somewhere on the Campus. Walk to it for bonus {XP_LABEL} and to keep your streak.</span></li>
                            <li className="flex gap-2"><CalendarDays className="h-4 w-4 shrink-0" /><span>Missed one? It stays open until the stage ends.</span></li>
                        </ul>
                    </section>

                    <div className="flex justify-end"><WorldSettings slug={slug} me={participant} color={color} /></div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Coins; value: string; label: string })
{
    return (
        <div className="rounded-2xl bg-white/10 px-1 py-2">
            <p className="inline-flex items-center gap-1 text-base font-extrabold tabular-nums"><Icon className="h-3.5 w-3.5 opacity-80" />{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
        </div>
    )
}
