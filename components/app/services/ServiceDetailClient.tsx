'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import
    {
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
import { toast } from 'sonner'
import { getStreamClient } from '@/lib/stream'
import { deleteService } from '@/lib/actions/services'

interface ServiceDetailClientProps
{
    serviceId: string
    providerId: string
    providerName: string
    currentUserId: string | null
    currentUserName: string
    isOwner: boolean
}

export default function ServiceDetailClient({
    serviceId,
    providerId,
    providerName,
    currentUserId,
    currentUserName,
    isOwner,
}: ServiceDetailClientProps)
{
    const router = useRouter()
    const [contactLoading, setContactLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    async function handleContactProvider()
    {
        if (!currentUserId)
        {
            toast.error('You must be logged in to contact the provider')
            return
        }

        if (currentUserId === providerId)
        {
            toast.info('This is your own listing')
            return
        }

        setContactLoading(true)
        try
        {
            // 1. Fetch Stream token
            const res = await fetch('/api/stream-token')
            if (!res.ok) throw new Error('Failed to get chat token')
            const { token } = await res.json()

            // 2. Get or create Stream client
            const client = getStreamClient()

            // 3. Connect user if not already connected
            if (!client.userID)
            {
                await client.connectUser(
                    { id: currentUserId, name: currentUserName },
                    token
                )
            }

            // 4. Create or find DM channel between current user and provider
            const channel = client.channel('messaging', {
                members: [currentUserId, providerId],
            })

            // 5. Watch the channel (creates it if it doesn't exist)
            await channel.watch()

            // 6. Navigate to the channel
            router.push(`/app/chat/${channel.id}`)
        } catch (err)
        {
            console.error('[ServiceDetailClient] handleContactProvider error:', err)
            toast.error('Could not open chat. Please try again.')
        } finally
        {
            setContactLoading(false)
        }
    }

    async function handleDelete()
    {
        setDeleteLoading(true)
        try
        {
            await deleteService(serviceId)
            toast.success('Service listing deleted')
            router.push('/app/services')
        } catch (err)
        {
            const msg = err instanceof Error ? err.message : 'Failed to delete service'
            toast.error(msg)
        } finally
        {
            setDeleteLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Contact Provider button — hidden for owner */}
            {!isOwner && (
                <Button
                    className="w-full gradient-primary text-white gap-2 py-5 text-base font-semibold"
                    onClick={handleContactProvider}
                    disabled={contactLoading}
                >
                    {contactLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <MessageCircle className="h-5 w-5" />
                    )}
                    {contactLoading ? 'Opening chat…' : `Contact ${providerName}`}
                </Button>
            )}

            {/* Owner controls */}
            {isOwner && (
                <div className="flex gap-2">
                    <Link href={`/app/services/edit/${serviceId}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit Listing
                        </Button>
                    </Link>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Delete Service Listing
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this service listing? It will no longer
                                    be visible in the catalogue. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete Listing
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    )
}
