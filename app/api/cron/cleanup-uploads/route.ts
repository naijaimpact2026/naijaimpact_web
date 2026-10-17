import { NextRequest, NextResponse } from 'next/server'
import { cleanupAbandonedUploads } from '@/lib/modushive/cleanup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Verify Vercel Cron secret if configured
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
