'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { closeCampaign, reopenCampaign } from '@/lib/actions/funding'
import { toast } from 'sonner'
import { Ban, Loader2, PlayCircle } from 'lucide-react'

interface CloseCampaignButtonProps {
  campaignId: string
  isClosed: boolean
}

export default function CloseCampaignButton({
  campaignId,
  isClosed,
}: CloseCampaignButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (isClosed) {
          const res = await reopenCampaign(campaignId)
          toast.success(res.message || 'Campaign reopened successfully!')
        } else {
          const res = await closeCampaign(campaignId)
          toast.success(res.message || 'Campaign concluded successfully!')
        }
        setOpen(false)
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || 'An error occurred while updating the campaign')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 font-medium py-5 rounded-xl border transition-colors ${
            isClosed
              ? 'border-emerald-600/40 text-emerald-600 hover:bg-emerald-500/10'
              : 'border-destructive/30 text-destructive hover:bg-destructive/10'
          }`}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isClosed ? (
            <PlayCircle className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {isClosed ? 'Reopen Campaign' : 'Close Campaign'}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-3xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">
            {isClosed ? 'Reopen this Campaign?' : 'Close & Conclude this Campaign?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {isClosed
              ? 'Reopening will reactivate this campaign and allow supporters to make new donations once again.'
              : 'Closing this campaign will immediately pause all new donations. The campaign will be marked as concluded in the crowdfunding directory. You can reopen it at any time.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleToggle()
            }}
            disabled={isPending}
            className={`rounded-xl font-bold ${
              isClosed
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-destructive hover:bg-destructive/90 text-white'
            }`}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </span>
            ) : isClosed ? (
              'Confirm & Reopen'
            ) : (
              'Confirm & Close'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
