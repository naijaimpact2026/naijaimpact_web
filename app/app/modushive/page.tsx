import { getCurrentUser } from '@/lib/supabase/auth'
import {
    listArchivedReplays,
    listLiveNow,
    listMyPendingVideos,
    listReadyVideos,
} from '@/lib/modushive/queries'
import { canGoLive } from '@/lib/modushive/config'
import { ProcessingRefresher } from '@/components/app/modushive/VideoActions'
import NovoStreamPageClient from '@/components/app/modushive/NovoStreamPageClient'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'NovoStream — Live & Replays | HubNovo',
    description: 'Watch live broadcasts, explore channels, and discover replays from the Hubnovo community.',
}

export default async function ModusHivePage() {
    const { profile } = await getCurrentUser()
    const showGoLive = !!profile && canGoLive(profile.role)

    // Fetch pending uploads, live streams, and archived replays concurrently in parallel
    const [pending, live, replays] = await Promise.all([
        listMyPendingVideos(profile?.id ?? ''),
        listLiveNow(),
        listArchivedReplays(15),
    ])

    const stillProcessing = pending.some(
        (v) => v.status === 'uploading' || v.status === 'processing'
    )

    return (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
            <ProcessingRefresher active={stillProcessing} />

            <NovoStreamPageClient
                profile={profile}
                showGoLive={showGoLive}
                liveStreams={live}
                replays={replays}
                pendingVideos={pending}
            />
        </div>
    )
}
