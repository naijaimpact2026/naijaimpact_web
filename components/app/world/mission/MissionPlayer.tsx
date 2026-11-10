'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { toast } from '@/components/toast'
import { submitWorldAttemptAction } from '@/lib/actions/world'
import type { AttemptPayload, AttemptView, FormConfig, MissionView, QuizConfig, ScenarioConfig, SortConfig } from '@/lib/world/types'
import { formatUnlock } from '@/lib/world/ui'
import AttemptResult from './AttemptResult'
import FormActivity, { clearFormDraft } from './FormActivity'
import QuizActivity from './QuizActivity'
import ScenarioActivity from './ScenarioActivity'
import SortActivity from './SortActivity'
import ReviewingCard from './ReviewingCard'

/** Runs a mission: shows its state, renders the activity, submits, shows the result. */
export default function MissionPlayer({ slug, mission, attempts, color, homeHref }: { slug: string; mission: MissionView; attempts: AttemptView[]; color: string; homeHref: string })
{
    const router = useRouter()
    const [pending, start] = useTransition()
    const [result, setResult] = useState<{ attempt: AttemptView; awarded: { xp: number; tokens: number }; badge: { key: string; label: string } | null } | null>(null)
    const [retrying, setRetrying] = useState(false)
    // A fresh key resets the activity's local state when retrying.
    const [round, setRound] = useState(0)

    const last = attempts.at(-1) ?? null

    function submit(payload: AttemptPayload)
    {
        start(async () =>
        {
            const r = await submitWorldAttemptAction(slug, mission.id, payload)
            if (!r.ok) { toast.error(r.error); return }
            clearFormDraft(mission.id)
            setResult({ attempt: r.attempt, awarded: r.awarded, badge: r.badge })
            setRetrying(false)
            if (r.awarded.xp > 0) toast.success(`+${r.awarded.xp} XP earned!`)
            router.refresh()
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }

    if (mission.status === 'locked')
    {
        return (
            <section className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">This mission isn’t open yet</h2>
                <p className="text-sm text-muted-foreground">It opens {formatUnlock(mission.unlocksAt)}.</p>
            </section>
        )
    }

    // Show a result: the one just submitted, or the latest one unless the player chose to retry.
    const shown = result ?? (!retrying && last && (mission.status !== 'available') ? { attempt: last, awarded: null, badge: null } : null)
    if (shown)
    {
        // The server refresh may or may not have landed yet — the attempt number is the source of truth.
        const used = Math.max(mission.attemptsUsed, shown.attempt.attemptNo)
        return (
            <AttemptResult
                slug={slug}
                mission={{ ...mission, attemptsUsed: used }}
                attempt={shown.attempt}
                awarded={shown.awarded}
                badge={shown.badge}
                color={color}
                canRetry={mission.maxAttempts - used > 0}
                onRetry={() => { setResult(null); setRetrying(true); setRound((n) => n + 1) }}
                homeHref={homeHref}
            />
        )
    }

    const props = { color, submitting: pending, onSubmit: submit }
    return (
        <>
        {/* Keep the activity mounted (hidden) while marking, so nothing is lost if the submit fails. */}
        {pending && <ReviewingCard color={color} ai={mission.reviewMode !== 'auto'} />}
        <section key={round} hidden={pending} className="hw-rise rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm" style={{ animationDelay: '120ms' }}>
            {mission.kind === 'quiz' && <QuizActivity config={mission.config as QuizConfig} {...props} />}
            {mission.kind === 'sort' && <SortActivity config={mission.config as SortConfig} {...props} />}
            {mission.kind === 'scenario' && <ScenarioActivity config={mission.config as ScenarioConfig} {...props} />}
            {!['quiz', 'sort', 'scenario'].includes(mission.kind) && <FormActivity slug={slug} missionId={mission.id} config={mission.config as FormConfig} {...props} />}
        </section>
        </>
    )
}
