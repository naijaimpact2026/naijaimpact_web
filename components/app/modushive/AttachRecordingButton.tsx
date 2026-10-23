'use client'

import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import UploadReplayRecordingModal from '@/components/app/modushive/UploadReplayRecordingModal'

interface AttachRecordingButtonProps {
    videoId: string
    videoTitle?: string
    className?: string
}

export default function AttachRecordingButton({
    videoId,
    videoTitle,
    className,
}: AttachRecordingButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                    className ||
                    'inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors shadow-sm'
                }
            >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Broadcast Recording</span>
            </button>

            <UploadReplayRecordingModal
                isOpen={open}
                onClose={() => setOpen(false)}
                videoId={videoId}
                videoTitle={videoTitle}
            />
        </>
    )
}
