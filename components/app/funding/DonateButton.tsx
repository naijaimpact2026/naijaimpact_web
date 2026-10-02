'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import DonateModal from './DonateModal'

interface DonateButtonProps {
  campaignId: string
  campaignTitle: string
  userEmail?: string
  className?: string
}

export default function DonateButton({
  campaignId,
  campaignTitle,
  userEmail,
  className,
}: DonateButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        className={className || 'gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm'}
        onClick={() => setOpen(true)}
      >
        <Heart className="h-4 w-4 fill-white" />
        Donate
      </Button>

      <DonateModal
        open={open}
        onOpenChange={setOpen}
        campaignId={campaignId}
        campaignTitle={campaignTitle}
        userEmail={userEmail}
      />
    </>
  )
}
