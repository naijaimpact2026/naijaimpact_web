'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/toast'
import { deleteLiveStream } from '@/lib/actions/modushive'

interface DeleteLiveStreamButtonProps {
    liveStreamId: string
    streamTitle?: string
    redirectTo?: string
    onDeleted?: () => void
}

export default function DeleteLiveStreamButton({
    liveStreamId,
    streamTitle,
    redirectTo,
    onDeleted,
}: DeleteLiveStreamButtonProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
        startTransition(async () => {
            const res = await deleteLiveStream(liveStreamId)
            if (!res.ok) {
                toast.error(res.error || 'Failed to delete live stream')
                return
            }
            toast.success(`Stream "${streamTitle || ''}" deleted.`)
            setOpen(false)
            if (onDeleted) onDeleted()
            if (redirectTo) {
                router.push(redirectTo)
            } else {
                router.refresh()
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    disabled={isPending}
                    title="Delete stream"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Delete stream</span>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl max-w-md border-border bg-card dark:bg-[#121824] p-6 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold text-foreground">
                        Delete this live stream?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to delete <strong className="text-foreground">{streamTitle || 'this stream'}</strong>? This will permanently remove the stream, its keys, and records. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
                    <AlertDialogCancel
                        disabled={isPending}
                        className="rounded-full border-border hover:bg-muted"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                    >
                        {isPending ? (
                            <span className="inline-flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                            </span>
                        ) : (
                            'Delete stream'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
