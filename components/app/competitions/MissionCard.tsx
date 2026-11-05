'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Hand, Loader2, ShieldCheck, Upload, XCircle, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { checkInMission, claimMission } from '@/lib/actions/competitions'
import type { MissionView } from '@/lib/competitions/config'
import ProofDialog from './ProofDialog'

interface Props
{
    mission: MissionView
    joined: boolean
    seasonOpen: boolean
    themeColor: string
}

const VERIFY_LABEL = {
    auto: { icon: ShieldCheck, text: 'Auto-verified' },
    proof: { icon: Upload, text: 'Proof needed' },
    checkin: { icon: Hand, text: 'Self check-in' },
} as const

export default function MissionCard({ mission, joined, seasonOpen, themeColor }: Props)
{
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [proofOpen, setProofOpen] = useState(false)

    const ready = mission.verification === 'auto' && (mission.progress ?? 0) >= mission.target
    const sub = mission.submission
    const pct = mission.verification === 'auto' && mission.progress !== null ? Math.round((mission.progress / mission.target) * 100) : null
    const Verify = VERIFY_LABEL[mission.verification]

    function run(action: () => Promise<{ ok: true; xp: number } | { ok: false; error: string }>)
    {
        startTransition(async () =>
        {
            const res = await action()
            if (!res.ok) { toast.error(res.error); return }
            toast.success(res.xp > 0 ? `+${res.xp} XP earned!` : 'Already completed.')
            router.refresh()
        })
    }

    let cta: React.ReactNode = null
    if (mission.completed)
    {
        cta = <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Done</span>
    } else if (!joined || !seasonOpen)
    {
        cta = null
    } else if (mission.verification === 'auto')
    {
        cta = (
            <button
                type="button"
                disabled={!ready || pending}
                onClick={() => run(() => claimMission(mission.id))}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all ${ready
                    ? 'text-white shadow-md hover:opacity-90 animate-in zoom-in-95'
                    : 'bg-muted text-muted-foreground'}`}
                style={ready ? { backgroundColor: themeColor } : undefined}
            >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {ready ? `Claim +${mission.xp} XP` : `${mission.progress ?? 0}/${mission.target}`}
            </button>
        )
    } else if (mission.verification === 'checkin')
    {
        cta = (
            <button
                type="button"
                disabled={pending}
                onClick={() => run(() => checkInMission(mission.id))}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted"
            >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hand className="h-3.5 w-3.5" />} I’ve done this
            </button>
        )
    } else if (sub?.status === 'pending')
    {
        cta = <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400"><Clock className="h-4 w-4" /> In review</span>
    } else
    {
        cta = (
            <button
                type="button"
                onClick={() => setProofOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white shadow-md hover:opacity-90"
                style={{ backgroundColor: themeColor }}
            >
                <Upload className="h-3.5 w-3.5" /> {sub?.status === 'rejected' ? 'Resubmit' : 'Submit proof'}
            </button>
        )
    }

    return (
        <div className={`rounded-2xl border p-3.5 transition-colors ${mission.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card'}`}>
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                    <p className={`text-sm font-bold ${mission.completed ? 'text-muted-foreground line-through decoration-1' : 'text-foreground'}`}>{mission.title}</p>
                    {mission.description && <p className="text-xs text-muted-foreground">{mission.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                            <Zap className="h-3 w-3" /> {mission.xp} XP
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                            <Verify.icon className="h-3 w-3" /> {Verify.text}
                        </span>
                    </div>
                    {sub?.status === 'rejected' && !mission.completed && (
                        <p className="flex items-start gap-1 pt-1 text-[11px] text-destructive">
                            <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> Not approved{sub.review_note ? `: ${sub.review_note}` : '.'}
                        </p>
                    )}
                </div>
                <div className="shrink-0 pt-0.5">{cta}</div>
            </div>
            {pct !== null && !mission.completed && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: themeColor }} />
                </div>
            )}
            {mission.verification === 'proof' && <ProofDialog mission={mission} open={proofOpen} onOpenChange={setProofOpen} />}
        </div>
    )
}
