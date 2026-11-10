import { jsonError, readJson, withProfile } from '@/lib/world/api'
import { askCoach } from '@/lib/world/coach'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/competitions/:slug/missions/:missionId/coach
 * body = { message: string, history?: { role: 'user' | 'assistant', content: string }[] } → { ok, reply }
 * The coach explains and guides; it never writes the submission. 30 messages per user per day.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string; missionId: string }> })
{
    const { slug, missionId } = await params
    return withProfile(request, async ({ profile }) =>
    {
        const b = await readJson(request)
        if (!b || typeof b.message !== 'string') return jsonError('Send { message, history? }.', 400)
        const r = await askCoach(slug, missionId, profile, { message: b.message, history: b.history })
        if (r.ok) return NextResponse.json(r)
        const status = /not found/i.test(r.error) ? 404 : /today’s/.test(r.error) ? 429 : /busy|isn’t available right now/.test(r.error) ? 503 : 400
        return jsonError(r.error, status)
    })
}
