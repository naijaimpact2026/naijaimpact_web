'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props { postId: string; postCaption: string }

export default function PostDetailShareButton({ postId, postCaption }: Props)
{
    const [copied, setCopied] = useState(false)

    async function handleShare()
    {
        const url = `${window.location.origin}/app/feed/${postId}`
        if (navigator.share)
        {
            try
            {
                await navigator.share({ title: postCaption.slice(0, 60) || 'HubNovo post', url })
            } catch { /* user cancelled */ }
        } else
        {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Link copied!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 mt-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Share this post'}
        </button>
    )
}
