import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { cleanupAbandonedUploads } from '@/lib/modushive/cleanup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; refuse if it's unset.
    const cronSecret = process.env.CRON_SECRET
    const expected = Buffer.from(`Bearer ${cronSecret ?? ''}`)
    const given = Buffer.from(request.headers.get('authorization') ?? '')

    if (!cronSecret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await cleanupAbandonedUploads(24)

    return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
    })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return GET(request)
}
