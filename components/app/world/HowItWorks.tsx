'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, CircleHelp, Coins, Rocket, Swords, Trophy, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

/*
 * "How it works" — a 5-step guide shown once after joining (remembered per
 * browser) and reopenable from the "?" button on the home screen.
 */

const STEPS = [
    { icon: CalendarDays, title: 'A new quest every day', body: 'Each day from Monday to Saturday a new 15–30 minute mission opens on your home screen under “Today’s quest”. Missed one? It waits for you under “Catch up”. No streak pressure.' },
    { icon: Upload, title: 'Do the task, share your proof', body: 'Missions are quizzes, mini-games, scenarios and real-world tasks like interviewing someone or building something. Upload photos, files or videos as proof, but never other people’s names or phone numbers.' },
    { icon: Coins, title: 'Get feedback and rewards', body: 'Quizzes and games are marked instantly. Written work gets instant AI feedback against a rubric. Pass to earn XP (your level) and HubTokens (rewards). Not passed? You get 3 tries.' },
    { icon: Swords, title: 'Sunday is boss day', body: 'Every Sunday brings a bigger boss challenge that brings the week together. Judges score it, and passing earns the week’s badge.' },
    { icon: Trophy, title: 'Pass the stage, climb the league', body: 'Every 4 weeks is a stage. Finish all its missions with a score of 60+ to unlock the next one. Your XP also counts for your campus in the campus vs campus league.' },
]

const SEEN_KEY = 'hubnovo:world-guide-seen'

export default function HowItWorks({ color, autoOpen = false }: { color: string; autoOpen?: boolean })
{
    const [open, setOpen] = useState(false)
    const [i, setI] = useState(0)

    useEffect(() =>
    {
        if (!autoOpen) return
        try { if (!localStorage.getItem(SEEN_KEY)) setOpen(true) } catch { /* storage blocked */ }
    }, [autoOpen])

    function close(next: boolean)
    {
        setOpen(next)
        if (!next) { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } setI(0) }
    }

    const step = STEPS[i]
    const last = i === STEPS.length - 1
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hw-press inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25"
                aria-label="How the competition works"
            >
                <CircleHelp className="h-4 w-4" /> How it works
            </button>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent className="max-w-md gap-0 overflow-hidden p-0 rounded-3xl">
                    <div className="px-6 pt-7 pb-5 text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 100%)` }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">How it works · {i + 1} of {STEPS.length}</p>
                        <div key={i} className="hw-slide-in mt-4 flex items-center gap-3">
                            <span className="hw-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><step.icon className="h-6 w-6" /></span>
                            <DialogTitle className="text-xl font-extrabold leading-tight text-white">{step.title}</DialogTitle>
                        </div>
                    </div>
                    <div className="space-y-5 px-6 py-5">
                        <DialogDescription key={i} className="hw-slide-in text-sm leading-relaxed text-foreground">{step.body}</DialogDescription>
                        <div className="flex items-center justify-center gap-1.5" aria-hidden>
                            {STEPS.map((_, n) => (
                                <span key={n} className="h-1.5 rounded-full transition-all duration-300" style={{ width: n === i ? 22 : 6, backgroundColor: n <= i ? color : 'var(--muted)' }} />
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
                                {last ? <><Rocket className="h-4 w-4" /> Let’s go</> : <>Next <ArrowRight className="h-4 w-4" /></>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
