'use client'

import { useState } from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props
{
    postId: string
    caption: string
    reactionCount: number
    commentCount: number
    authorUsername: string
    createdAt: string
}

export default function PostDetailActions({
    postId,
    caption,
    reactionCount,
    commentCount,
    authorUsername,
    createdAt,
}: Props)
{
    const [copied, setCopied] = useState(false)

    async function handleShare()
    {
        const url = `${window.location.origin}/app/feed/${postId}`
        if (navigator.share)
        {
            try { await navigator.share({ title: caption.slice(0, 60) || 'HubNovo post', url }) }
            catch { /* cancelled */ }
        } else
        {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Link copied!')
            setTimeout(() => setCopied(false), 2500)
        }
    }

    const date = new Date(createdAt).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Post info</h3>
            <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Author</dt>
                    <dd>
                        <a href={`/app/profile/${authorUsername}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors">
                            @{authorUsername}
                        </a>
                    </dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium text-foreground">{date}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Reactions</dt>
                    <dd className="font-semibold text-foreground">{reactionCount.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Comments</dt>
                    <dd className="font-semibold text-foreground">{commentCount.toLocaleString()}</dd>
                </div>
            </dl>

            <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
                {copied
                    ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                    : <><Share2 className="w-3.5 h-3.5" /> Share this post</>
                }
            </button>
        </div>
    )
}
