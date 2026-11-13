import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { sendDailyQuestReminders } from '@/lib/world/reminders'

// Hubnovo World: "today's quest is open" reminders. Runs daily at 06:00 UTC
// (07:00 in Lagos), after the day's quest unlocked at midnight. Safe to re-run.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: NextRequest): boolean
{
    // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; refuse if it's unset.
    const cronSecret = process.env.CRON_SECRET
    const expected = Buffer.from(`Bearer ${cronSecret ?? ''}`)
    const given = Buffer.from(request.headers.get('authorization') ?? '')
    return !!cronSecret && given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: NextRequest): Promise<NextResponse>
{
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try
    {
        const sent = await sendDailyQuestReminders()
        console.log('[cron] world-reminders', JSON.stringify(sent))
        return NextResponse.json({ ok: true, sent })
    }
    catch (e)
    {
        console.error('[cron] world-reminders failed:', e instanceof Error ? e.message : e)
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
