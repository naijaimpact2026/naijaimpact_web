'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDownToLine, Loader2 } from 'lucide-react'
import { getCampaignWithdrawalSummary } from '@/lib/actions/funding'
import type { CampaignWithdrawalSummary } from '@/lib/types'
import WithdrawCampaignModal from './WithdrawCampaignModal'
import { toast } from 'sonner'

interface WithdrawCampaignButtonProps {
  campaignId: string
  campaignTitle: string
  amountRaised: number
  hasPin: boolean
}

export default function WithdrawCampaignButton({
  campaignId,
  campaignTitle,
  amountRaised,
  hasPin: initialHasPin,
}: WithdrawCampaignButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [summary, setSummary] = useState<CampaignWithdrawalSummary | null>(null)

  const handleOpen = () => {
    startTransition(async () => {
      try {
        const res = await getCampaignWithdrawalSummary(campaignId)
        setSummary(res)
        setOpen(true)
      } catch (err: any) {
        toast.error(err.message || 'Could not load withdrawal summary')
      }
    })
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={isPending}
        className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowDownToLine className="w-4 h-4" />
        )}
        Withdraw Funds
      </Button>

      {summary && (
        <WithdrawCampaignModal
          open={open}
          onOpenChange={setOpen}
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          amountRaised={summary.amountRaised}
          totalWithdrawn={summary.totalWithdrawn}
          availableBalance={summary.availableBalance}
          hasPin={summary.hasPin ?? initialHasPin}
          pastPayouts={summary.pastPayouts}
        />
      )}
    </>
  )
}
