'use client'

import { useState } from 'react'
import { Film } from 'lucide-react'
import PublishStreamVideoModal from '@/components/app/modushive/PublishStreamVideoModal'
import type { LiveStreamWithHost } from '@/lib/types'

interface HostReplayActionProps {
    stream: LiveStreamWithHost
}

export default function HostReplayAction({ stream }: HostReplayActionProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors shadow-xs"
            >
                <Film className="h-3.5 w-3.5" />
                <span>Upload / Publish Replay Video</span>
            </button>

            {isOpen && (
                <PublishStreamVideoModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    stream={stream}
                />
            )}
        </>
    )
}
