'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import DonateModal from './DonateModal'

interface FundingDetailClientProps
{
    campaignId: string
    campaignTitle: string
    userEmail: string
    isEnded: boolean
}

export default function FundingDetailClient({
    campaignId,
    campaignTitle,
    userEmail,
    isEnded,
}: FundingDetailClientProps)
{
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <Button
                className="w-full gradient-primary text-white gap-2 py-5 text-base font-semibold"
                onClick={() => setModalOpen(true)}
                disabled={isEnded}
            >
                <Heart className="h-5 w-5" />
                {isEnded ? 'Campaign ended' : 'Donate now'}
            </Button>

            <DonateModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                campaignId={campaignId}
                campaignTitle={campaignTitle}
                userEmail={userEmail}
            />
        </>
    )
}
