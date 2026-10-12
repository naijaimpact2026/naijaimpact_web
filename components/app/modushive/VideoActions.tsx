'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { deleteVideo } from '@/lib/actions/modushive'

export function DeleteVideoButton({ videoId, redirectTo }: { videoId: string; redirectTo?: string })
{
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function handleDelete()
    {
        if (!window.confirm('Delete this video? This cannot be undone.')) return
        startTransition(async () =>
        {
            const res = await deleteVideo(videoId)
            if (!res.ok) { toast.error(res.error); return }
            toast.success('Video deleted')
            if (redirectTo) router.push(redirectTo)
            else router.refresh()
        })
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
        </button>
    )
}

/**
 * Re-fetches the page every few seconds while something is still
 * processing, so the card flips to ready without a manual reload.
 */
export function ProcessingRefresher({ active, intervalMs = 8000 }: { active: boolean; intervalMs?: number })
{
    const router = useRouter()
    const [ticks, setTicks] = useState(0)

    useEffect(() =>
    {
        // Give up after ~5 min so an abandoned tab doesn't poll forever.
        if (!active || ticks > 40) return
        const t = setTimeout(() => { router.refresh(); setTicks((n) => n + 1) }, intervalMs)
        return () => clearTimeout(t)
    }, [active, ticks, intervalMs, router])

    return null
}
