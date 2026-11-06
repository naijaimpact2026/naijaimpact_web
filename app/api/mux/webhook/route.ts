import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getMux, isMuxConfigured } from '@/lib/modushive/mux'
import { applyAssetErrored, applyAssetReady, applyLiveRecording, applyStreamActive, applyStreamIdle } from '@/lib/modushive/sync'

/**
 * Mux → ModusHive status sync. Signature-verified with MUX_WEBHOOK_SECRET.
 *
 * Uploads carry `passthrough = videos.id`; live recordings carry
 * `passthrough = live:<live_streams.id>` (set in createLiveStream).
 * Handlers are idempotent — Mux retries on any non-2xx. The same apply*
 * helpers back the pull fallback in lib/modushive/sync.ts.
 */
export async function POST(request: Request)
{
    if (!isMuxConfigured() || !process.env.MUX_WEBHOOK_SECRET)
        return NextResponse.json({ error: 'Mux webhook not configured' }, { status: 503 })

    const body = await request.text()
    let event
    try
    {
        event = await getMux().webhooks.unwrap(body, request.headers)
    } catch
    {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    switch (event.type)
    {
        case 'video.asset.ready': {
            const asset = event.data
            // Live recordings are handled on live_stream_completed — they turn
            // "ready" while the broadcast is still running.
            if (asset.passthrough && !asset.passthrough.startsWith('live:'))
                await applyAssetReady(asset.passthrough, asset)
            break
        }

        case 'video.asset.errored': {
            const asset = event.data
            if (asset.passthrough && !asset.passthrough.startsWith('live:'))
                await applyAssetErrored(asset.passthrough, asset)
            break
        }

        case 'video.asset.live_stream_completed': {
            const asset = event.data
            if (asset.passthrough?.startsWith('live:'))
                await applyLiveRecording(asset.passthrough.slice(5), asset)
            break
        }

        case 'video.asset.deleted': {
            await createServiceClient().from('videos').delete().eq('provider_asset_id', event.data.id)
            break
        }

        case 'video.live_stream.active':
            await applyStreamActive(event.data.id)
            break

        // Fires once the reconnect window has passed after a disconnect.
        case 'video.live_stream.idle':
            await applyStreamIdle(event.data.id)
            break
    }

    return NextResponse.json({ received: true })
}
