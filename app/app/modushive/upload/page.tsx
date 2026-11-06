import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getUploadLimits } from '@/lib/modushive/config'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { isR2Configured } from '@/lib/modushive/r2'
import UploadForm from '@/components/app/modushive/UploadForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Upload — Livestream' }

export default async function UploadVideoPage()
{
    const { profile } = await getCurrentUser()
    const limits = getUploadLimits(profile?.role)
    const enabled = isMuxConfigured() && isR2Configured()

    return (
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
            <Link href="/app/modushive" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Livestream
            </Link>

            <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Upload a video</h1>
                <p className="mt-1 text-sm text-muted-foreground">Share something short with the HubNovo community.</p>
            </div>

            {enabled ? (
                <UploadForm maxBytes={limits.maxBytes} maxDurationS={limits.maxDurationS} />
            ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-5">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Uploads are coming soon</p>
                        <p className="mt-1 text-sm text-muted-foreground">We&apos;re finishing the setup for video uploads. Check back shortly.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
