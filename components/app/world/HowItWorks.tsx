'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, ArrowRight, CalendarDays, CircleHelp, Coins, Compass, Flag, Rocket, ShieldCheck, Swords, Target, Trophy, Upload, Zap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AnimatedBar } from './fx'

/*
 * Campus briefing: a personal "your week at a glance" page, then how the
 * competition works in detail, then the fair-play rules. Opens once per
 * visit to the Campus home (sessionStorage) unless the player turns that
 * off; the header button always reopens it.
 */

export interface BriefingSummary
{
    pathwayName: string
    week: number | null
    day: number | null
    dayName: string | null
    today: { title: string; href: string; status: string; xp: number } | null
    catchUp: number
    stage: { number: number; total: number; passMark: number; done: number; count: number } | null
    level: { level: number; name: string } | null
    xp: number
    tokens: number
}

const DETAIL = [
    {
        icon: CalendarDays, title: 'A new quest every day',
        points: [
            'Monday to Saturday, a new 15–30 minute mission opens at midnight (Lagos time) under “Today’s quest”.',
            'Missed a day? It moves to “Catch up” and stays open. No streak pressure.',
            'Use the week view to see what’s coming and when each mission opens.',
        ],
    },
    {
        icon: Upload, title: 'Do the task, share your proof',
        points: [
            'Missions are quizzes, mini-games, choose-your-path scenarios, boards and canvases, and real-world tasks.',
            'Real-world tasks mean talking to people, observing your community or building something, then uploading photos, PDFs, links or short videos.',
            'Each mission has “How to do this” steps, and you can tap “Ask Novo for help” any time.',
            'Your answers save as a draft automatically, so you can come back later.',
        ],
    },
    {
        icon: Zap, title: 'Get feedback and rewards',
        points: [
            'Quizzes and games are marked instantly. Written work gets instant AI feedback against a clear rubric.',
            'Pass to earn XP (it raises your level) and HubTokens (for rewards).',
            'Not passed yet? Read the feedback and try again. You get 3 attempts per mission.',
            'Quizzes count your first try toward your score, so take your time.',
        ],
    },
    {
        icon: Swords, title: 'Sunday is boss day',
        points: [
            'Every Sunday brings a bigger boss challenge that brings the whole week together.',
            'Human judges score it with a rubric, usually within a few days.',
            'Passing earns that week’s badge, and Week 4’s finale completes the stage.',
        ],
    },
    {
        icon: Trophy, title: 'Pass the stage, climb the league',
        points: [
            'Every 4 weeks is a stage. Complete all its missions with a stage score of 60+ to unlock the next stage.',
            'Your stage score is: Evidence 40% · Quality 25% · Reflection 15% · Teamwork 10% · Showcase 10%.',
            'Your XP ranks you on your pathway’s leaderboard, and counts for your campus in the campus vs campus league.',
        ],
    },
]

const RULES = [
    'Never upload other people’s names, phone numbers, addresses or faces. Describe them by role instead, e.g. “trader at Oshodi”.',
    'Always ask permission before interviewing or recording anyone.',
    'Be honest: no made-up results or copied work. Reviewers check, and it costs you points.',
    'Think a score is wrong? Use “Appeal” on the result.',
    'HubTokens are rewards, not money. You can’t cash them out or buy a better score with them.',
]

const SESSION_KEY = 'hubnovo:world-briefing-shown'
const MUTE_KEY = 'hubnovo:world-briefing-muted'

export default function HowItWorks({ color, summary }: { color: string; summary: BriefingSummary })
{
    const [open, setOpen] = useState(false)
    const [i, setI] = useState(0)
    const [mute, setMute] = useState(false)
    const pages = 1 + DETAIL.length + 1

    useEffect(() =>
    {
        try
        {
            const muted = localStorage.getItem(MUTE_KEY) === '1'
            setMute(muted)
            if (!muted && !sessionStorage.getItem(SESSION_KEY)) { setOpen(true); sessionStorage.setItem(SESSION_KEY, '1') }
        } catch { /* storage blocked: don't auto-open */ }
    }, [])

    function close(next: boolean)
    {
        setOpen(next)
        if (!next) setI(0)
    }

    function toggleMute(v: boolean)
    {
        setMute(v)
        try { if (v) localStorage.setItem(MUTE_KEY, '1'); else localStorage.removeItem(MUTE_KEY) } catch { /* ignore */ }
    }

    const last = i === pages - 1
    const detail = i >= 1 && i <= DETAIL.length ? DETAIL[i - 1] : null
    const header = i === 0
        ? { icon: Compass, eyebrow: 'Your week at a glance', title: summary.week ? `Week ${summary.week} · ${summary.dayName}` : 'Welcome back' }
        : detail
            ? { icon: detail.icon, eyebrow: `How it works · ${i} of ${DETAIL.length}`, title: detail.title }
            : { icon: ShieldCheck, eyebrow: 'Fair play', title: 'Rules to remember' }
    const daysToBoss = summary.day ? 7 - summary.day : null

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hw-press inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25"
                aria-label="Your briefing and how the competition works"
            >
                <CircleHelp className="h-4 w-4" /> How it works
            </button>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-hidden rounded-3xl p-0">
                    <div className="px-6 pt-7 pb-5 text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 100%)` }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{header.eyebrow}</p>
                        <div key={i} className="hw-slide-in mt-3 flex items-center gap-3">
                            <span className="hw-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><header.icon className="h-6 w-6" /></span>
                            <DialogTitle className="text-xl font-extrabold leading-tight text-white">{header.title}</DialogTitle>
                        </div>
                    </div>

                    <div className="max-h-[52vh] overflow-y-auto px-6 py-5">
                        <DialogDescription className="sr-only">Your competition briefing and how Hubnovo World works.</DialogDescription>
                        <div key={i} className="hw-slide-in space-y-4">
                            {i === 0 && <Glance summary={summary} color={color} daysToBoss={daysToBoss} onGo={() => close(false)} />}
                            {detail && (
                                <ul className="space-y-3">
                                    {detail.points.map((p, n) => (
                                        <li key={n} className="hw-rise flex gap-3 text-sm leading-relaxed text-foreground" style={{ animationDelay: `${n * 60}ms` }}>
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {last && (
                                <>
                                    <ul className="space-y-3">
                                        {RULES.map((r, n) => (
                                            <li key={n} className="hw-rise flex gap-3 text-sm leading-relaxed text-foreground" style={{ animationDelay: `${n * 60}ms` }}>
                                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{r}
                                            </li>
                                        ))}
                                    </ul>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                                        <input type="checkbox" checked={mute} onChange={(e) => toggleMute(e.target.checked)} className="h-4 w-4" style={{ accentColor: color }} />
                                        Don’t show this every time I open the competition
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-border px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5" aria-hidden>
                            {Array.from({ length: pages }, (_, n) => (
                                <button key={n} type="button" tabIndex={-1} onClick={() => setI(n)} className="h-1.5 rounded-full transition-all duration-300" style={{ width: n === i ? 22 : 6, backgroundColor: n <= i ? color : 'var(--muted)' }} />
                            ))}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} className="hw-press inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                            <button
                                type="button"
                                onClick={() => last ? close(false) : setI((n) => n + 1)}
                                className="hw-press inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90"
                                style={{ backgroundColor: color }}
                            >
                                {last ? <><Rocket className="h-4 w-4" /> Let’s go</> : i === 0 ? <>How it works <ArrowRight className="h-4 w-4" /></> : <>Next <ArrowRight className="h-4 w-4" /></>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function Glance({ summary: s, color, daysToBoss, onGo }: { summary: BriefingSummary; color: string; daysToBoss: number | null; onGo: () => void })
{
    return (
        <div className="space-y-4">
            {s.today ? (
                <div className="hw-rise rounded-2xl border-2 p-4" style={{ borderColor: `${color}55` }}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Today’s quest</p>
                    <p className="mt-1 text-base font-bold text-foreground">{s.today.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.today.status === 'passed' ? 'Done. Nice work!' : `${s.today.xp} XP waiting for you`}</p>
                    {s.today.status !== 'passed' && (
                        <Link href={s.today.href} onClick={onGo} className="hw-press mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-md hover:opacity-90" style={{ backgroundColor: color }}>
                            <Target className="h-4 w-4" /> Start today’s quest
                        </Link>
                    )}
                </div>
            ) : (
                <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">No quest is scheduled today. A good time to catch up!</p>
            )}

            <div className="grid grid-cols-2 gap-2">
                <Tile icon={Flag} label="To catch up" value={s.catchUp === 0 ? 'All clear' : `${s.catchUp} mission${s.catchUp === 1 ? '' : 's'}`} delay={60} />
                <Tile icon={Swords} label="Boss challenge" value={daysToBoss === null ? '—' : daysToBoss === 0 ? 'Today!' : `In ${daysToBoss} day${daysToBoss === 1 ? '' : 's'}`} delay={120} />
                <Tile icon={Zap} label={s.level ? `Level ${s.level.level} · ${s.level.name}` : 'XP'} value={`${s.xp.toLocaleString('en-NG')} XP`} delay={180} />
                <Tile icon={Coins} label="HubTokens" value={s.tokens.toLocaleString('en-NG')} delay={240} />
            </div>

            {s.stage && (
                <div className="hw-rise space-y-2 rounded-2xl bg-muted/50 p-4" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-foreground">Stage {s.stage.number} score</span>
                        <span className="font-bold tabular-nums text-foreground">{s.stage.total} <span className="text-xs font-semibold text-muted-foreground">/ pass {s.stage.passMark}</span></span>
                    </div>
                    <AnimatedBar pct={s.stage.total} color={s.stage.total >= s.stage.passMark ? '#16A34A' : color} />
                    <p className="text-xs text-muted-foreground">{s.stage.done} of {s.stage.count} missions complete on {s.pathwayName}.</p>
                </div>
            )}
        </div>
    )
}

function Tile({ icon: Icon, label, value, delay }: { icon: typeof Flag; label: string; value: string; delay: number })
{
    return (
        <div className="hw-rise rounded-2xl border border-border p-3" style={{ animationDelay: `${delay}ms` }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p>
            <p className="mt-1 text-sm font-extrabold text-foreground">{value}</p>
        </div>
    )
}
