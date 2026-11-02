import { NextResponse } from 'next/server'
import { ALL_MASCOT_LOOKS } from '@/lib/mascot/config'
import { getFaceCoordsForImage } from '@/lib/mascot/face-coordinates'

/**
 * GET /api/ai/companion/looks — every Novo look, for the mobile app, so it
 * stays in sync with the web config instead of copying it.
 *
 * Public and read-only (the landing page's Novo serves signed-out visitors
 * too). Image URLs are absolute, on whichever host served the request.
 * `face` positions are % of the image box, x/y being each feature's centre —
 * the same values MascotFaceOverlay uses on web. The first look is the
 * default ("Gateway Novo"); see getMascotForPathname for route matching.
 */
export function GET(request: Request)
{
    const origin = new URL(request.url).origin

    const looks = ALL_MASCOT_LOOKS.map(({ image, ...look }) => ({
        ...look,
        imageUrl: `${origin}${image}`,
        face: getFaceCoordsForImage(image),
    }))

    return NextResponse.json(
        { looks },
        // Changes only on deploy: let CDNs and the app cache it for an hour.
        { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' } },
    )
}
