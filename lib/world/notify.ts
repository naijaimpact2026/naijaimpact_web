import { createServiceClient } from '@/lib/supabase/service'

/*
 * Hubnovo World notifications (bell + push). One type, 'competition'; the
 * message lives in title/body and the tap target in data.url. The push
 * trigger on public.notifications sends title/body through OneSignal.
 * Best-effort: never throws, never blocks the action that caused it.
 */

export interface WorldNotice
{
    userId: string
    title: string
    body: string
    /** In-app path the notification opens, e.g. /app/competitions/campus/squad */
    url: string
    /** What it is about (mission id, attempt id, squad id). */
    referenceId?: string | null
    referenceType?: 'world_quest' | 'world_attempt' | 'world_squad' | 'world_certificate'
    actorId?: string | null
}

const BATCH = 500

export async function notifyWorld(notices: WorldNotice[]): Promise<number>
{
    if (notices.length === 0) return 0
    const db = createServiceClient()
    let sent = 0
    for (let i = 0; i < notices.length; i += BATCH)
    {
        const rows = notices.slice(i, i + BATCH).map((n) => ({
            user_id: n.userId,
            actor_id: n.actorId ?? null,
            type: 'competition',
            category: 'competition',
            title: n.title.slice(0, 120),
            body: n.body.slice(0, 300),
            // reference_type is a DB enum without our kinds, so the kind lives in data.kind.
            data: { url: n.url, kind: n.referenceType ?? null, resource_id: n.referenceId ?? null },
            reference_id: n.referenceId ?? null,
            read: false,
        }))
        const { error } = await db.from('notifications').insert(rows)
        if (error) { console.error('world notify failed:', error.message); break }
        sent += rows.length
    }
    return sent
}
