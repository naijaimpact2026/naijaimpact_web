'use client'

import { useState } from 'react'
import { Share2, Check, Link2, Flag } from 'lucide-react'
import { toast } from '@/components/toast'
import ReportPostModal from './ReportPostModal'

interface Props
{
    postId: string
    caption: string
    reactionCount: number
    commentCount: number
    authorUsername: string
    createdAt: string
    allowSharing?: boolean
}

export default function PostDetailActions({
    postId,
    caption,
    reactionCount,
    commentCount,
    authorUsername,
    createdAt,
    allowSharing = true,
}: Props)
{
    const [copied, setCopied] = useState(false)
    const [reportModalOpen, setReportModalOpen] = useState(false)

    async function handleShare()
    {
        if (allowSharing === false)
        {
            toast.error('Sharing has been disabled for this post by the author.')
            return
        }
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
                aria-disabled={allowSharing === false}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    allowSharing === false
                        ? 'border-border/60 text-muted-foreground/60 cursor-not-allowed bg-muted/30'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
            >
                {allowSharing === false ? (
                    <>Sharing disabled</>
                ) : copied ? (
                    <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                    <><Share2 className="w-3.5 h-3.5" /> Share this post</>
                )}
            </button>

            <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-destructive/20 text-xs font-medium text-destructive/80 hover:bg-destructive/5 hover:text-destructive transition-colors"
            >
                <Flag className="w-3.5 h-3.5" /> Report this post
            </button>

            <ReportPostModal
                open={reportModalOpen}
                onOpenChange={setReportModalOpen}
                postId={postId}
                authorUsername={authorUsername}
            />
        </div>
    )
}
