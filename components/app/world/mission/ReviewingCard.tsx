'use client'

import { useEffect, useState } from 'react'
import { BookOpenCheck, ClipboardCheck, PenLine, Sparkles } from 'lucide-react'

/** Shown while a submission is being marked, so the wait feels alive. */
export default function ReviewingCard({ color, ai }: { color: string; ai: boolean })
{
    const steps = ai
        ? [
            { icon: BookOpenCheck, text: 'Reading your answers…' },
            { icon: ClipboardCheck, text: 'Checking them against the rubric…' },
            { icon: PenLine, text: 'Writing your feedback…' },
        ]
        : [{ icon: ClipboardCheck, text: 'Marking your answers…' }]
    const [i, setI] = useState(0)
    useEffect(() =>
    {
        if (steps.length < 2) return
        const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 1100)
        return () => clearInterval(t)
    }, [steps.length])
    const Step = steps[i].icon

    return (
        <section className="hw-pop flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm" aria-live="polite" aria-busy="true">
            <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full opacity-30 motion-reduce:hidden" style={{ backgroundColor: color }} />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: color }}>
                    <Sparkles className="h-7 w-7" />
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-base font-extrabold text-foreground">{ai ? 'Novo is reviewing your work' : 'Checking your answers'}</p>
                <p key={i} className="hw-slide-in flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Step className="h-4 w-4" />{steps[i].text}</p>
            </div>
            {steps.length > 1 && (
                <div className="flex gap-1.5" aria-hidden>
                    {steps.map((_, n) => <span key={n} className="h-1.5 rounded-full transition-all duration-500" style={{ width: n <= i ? 22 : 8, backgroundColor: n <= i ? color : 'var(--muted)' }} />)}
                </div>
            )}
        </section>
    )
}
