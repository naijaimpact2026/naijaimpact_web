import { NextResponse } from 'next/server'
import spec from '@/docs/api/competitions.openapi.json'

export const dynamic = 'force-dynamic'

/**
 * GET /api/docs/openapi.json — public OpenAPI 3.1 spec for the Competitions API.
 * The first server is always the host serving this file, so "Try it out"
 * in /api/docs calls the same deployment (staging → staging, prod → prod).
 */
export function GET(request: Request)
{
    const origin = new URL(request.url).origin
    const servers = [
        { url: `${origin}/api`, description: 'This deployment' },
        ...spec.servers.filter((s) => !s.url.startsWith(origin)),
    ]
    return NextResponse.json({ ...spec, servers }, {
        headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
    })
}
