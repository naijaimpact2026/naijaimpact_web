'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AvatarConfig } from '@/lib/competitions/config'
import JoinCompetitionCard from './JoinCompetitionCard'

export default function EditLookButton(props: { competitionId: string; themeColor: string; state: string | null; avatar: AvatarConfig | null })
{
    const [open, setOpen] = useState(false)
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
            >
                <Pencil className="h-3 w-3" /> Edit look
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your competitor</DialogTitle>
                        <DialogDescription>Change your look or your state.</DialogDescription>
                    </DialogHeader>
                    <JoinCompetitionCard
                        mode="edit"
                        competitionId={props.competitionId}
                        themeColor={props.themeColor}
                        initialState={props.state}
                        initialAvatar={props.avatar}
                        onDone={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
