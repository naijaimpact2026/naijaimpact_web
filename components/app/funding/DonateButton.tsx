'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import DonateModal from './DonateModal'

interface DonateButtonProps
{
    campaignId: string
    campaignTitle: string
    userEmail: string
}

export default function DonateButton({
    campaignId,
    campaignTitle,
    userEmail,
}: DonateButtonProps)
{
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => setModalOpen(true)}
                aria-label={`Donate to ${campaignTitle}`}
            >
                <Heart className="h-4 w-4" aria-hidden="true" />
                Donate Now
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
