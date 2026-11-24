'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Flame, Loader2, Sparkles, XCircle } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { claimDropAction } from '@/lib/actions/world'
import type { DropView } from '@/lib/world/drops'
import { XP_LABEL } from '@/lib/world/types'

interface Claimed { correct: boolean; xp: number; answer: string; explain: string; streak: number; picked: string | null }

/** Today's campus drop: one tap to answer, then the right answer and why, plus the streak. */
export default function DropDialog({ slug, drop, open, onClose, onClaimed }: {
    slug: string; drop: DropView; open: boolean; onClose: () => void; onClaimed: (r: { xp: number; streak: number }) => void
})
{
    const [pending, start] = useTransition()
    const [result, setResult] = useState<Claimed | null>(
        drop.claimed ? { ...drop.claimed, streak: drop.streak, picked: null } : null,
    )

    function answer(id: string)
    {
        start(async () =>
        {
            const r = await claimDropAction(slug, id)
            if (!r.ok) { toast.error(r.error); return }
            setResult({ correct: r.correct, xp: r.xp, answer: r.answer, explain: r.explain, streak: r.streak, picked: id })
            onClaimed({ xp: r.xp, streak: r.streak })
        })
    }

    const label = (id: string) => drop.options.find((o) => o.id === id)?.label ?? id

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="space-y-1 px-5 pb-3 pt-5 text-left" style={{ background: 'linear-gradient(135deg, #FDE68A 0%, #FEF3C7 60%, transparent 100%)' }}>
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-700"><Sparkles className="h-3.5 w-3.5" /> Daily campus drop</p>
                    <DialogTitle className="text-lg font-extrabold leading-snug text-[#102A43]">{drop.prompt}</DialogTitle>
                    <DialogDescription className="text-xs text-[#102A43]/70">
                        One tap. +{drop.xp.correct} {XP_LABEL} if you’re right, +{drop.xp.tried} for trying. Keeps your streak going.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 px-5 pb-5 pt-3">
                    {!result ? (
                        <div className="grid gap-2">
                            {drop.options.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    disabled={pending}
                                    onClick={() => answer(o.id)}
                                    className="hw-press flex min-h-12 items-center justify-center rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60 dark:hover:bg-amber-500/10"
                                >
                                    {o.label}
                                </button>
                            ))}
                            {pending && <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</p>}
                        </div>
                    ) : (
                        <div className="hw-pop space-y-3">
                            <div className={`flex items-start gap-3 rounded-2xl p-4 ${result.correct ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                {result.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
                                <div className="space-y-1 text-sm">
                                    <p className="font-extrabold text-foreground">
                                        {result.correct ? 'Spot on!' : `The answer is “${label(result.answer)}”.`}
                                        {result.xp > 0 && <span className="ml-1.5 text-amber-600">+{result.xp} {XP_LABEL}</span>}
                                    </p>
                                    <p className="text-muted-foreground">{result.explain}</p>
                                </div>
                            </div>
                            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-foreground">
                                <Flame className="h-4 w-4 text-orange-500" /> {result.streak}-day streak
                            </p>
                            <p className="text-center text-xs text-muted-foreground">A new drop lands tomorrow somewhere else on the Campus.</p>
                            <button type="button" onClick={onClose} className="hw-press w-full rounded-2xl bg-[#102A43] px-4 py-3 text-sm font-bold text-white hover:opacity-90">
                                Back to the Campus
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
