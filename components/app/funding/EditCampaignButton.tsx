'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface EditCampaignButtonProps {
  campaignId: string
}

export default function EditCampaignButton({ campaignId }: EditCampaignButtonProps) {
  return (
    <Link href={`/app/funding/edit/${campaignId}`} className="block w-full">
      <Button variant="outline" className="w-full gap-2 border-border hover:bg-muted font-medium py-5 rounded-xl">
        <Pencil className="h-4 w-4" />
        Edit Campaign
      </Button>
    </Link>
  )
}
