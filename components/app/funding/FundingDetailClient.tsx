'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Heart, RefreshCw, Sparkles } from 'lucide-react'
import DonateModal from './DonateModal'

interface FundingDetailClientProps {
  campaignId: string
  campaignTitle: string
  userEmail?: string
  isCompleted?: boolean
  isClosed?: boolean
  isGoalReached?: boolean
}

export default function FundingDetailClient({
  campaignId,
  campaignTitle,
  userEmail,
  isCompleted,
  isClosed,
  isGoalReached,
}: FundingDetailClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)

  const handleOpenDonate = () => {
    if (isCompleted) return
    setRecoveryMode(false)
    setModalOpen(true)
  }

  const handleOpenRecovery = () => {
    setRecoveryMode(true)
    setModalOpen(true)
  }

  return (
    <>
      <div className="space-y-2.5">
        {isCompleted ? (
          <div className="space-y-2">
            <Button
              disabled
              className="w-full bg-muted/80 text-muted-foreground font-bold gap-2.5 py-6 text-sm sm:text-base rounded-2xl cursor-not-allowed border border-border/80 opacity-90 shadow-none hover:bg-muted/80 hover:text-muted-foreground"
            >
              {isClosed ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  Initiative Concluded
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 fill-emerald-500 text-emerald-600 dark:text-emerald-400" />
                  Goal Achieved (Funding Completed)
                </>
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground leading-normal px-2">
              {isClosed
                ? 'This campaign was concluded by the organizer and is no longer accepting new donations.'
                : 'This initiative has reached its funding goal and is no longer accepting new donations. Thank you for your support!'}
            </p>
          </div>
        ) : (
          <Button
            className="group w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold gap-2.5 py-6 text-base rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-300 active:scale-[0.99]"
            onClick={handleOpenDonate}
          >
            <Heart className="h-5 w-5 fill-white transition-transform duration-300 group-hover:scale-110" />
            Donate Now
          </Button>
        )}

        <button
          type="button"
          onClick={handleOpenRecovery}
          className="w-full text-center text-xs text-muted-foreground hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 py-2 font-medium rounded-xl hover:bg-emerald-500/5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Verify or recover past contribution
        </button>
      </div>

      <DonateModal
        key={recoveryMode ? 'recovery' : 'donate'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        campaignId={campaignId}
        campaignTitle={campaignTitle}
        userEmail={userEmail}
        initialRecoveryMode={recoveryMode}
      />
    </>
  )
}
