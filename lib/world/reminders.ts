import { createServiceClient } from '@/lib/supabase/service'
import { loadMissionRows } from './service'
import { semesterClock } from './schedule'
import { notifyWorld, type WorldNotice } from './notify'

/*
 * Daily quest reminder (run once each morning by /api/cron/world-reminders).
 * For every live world competition: today's quest per pathway → one
 * notification to each player in that pathway who hasn't started it.
 * Idempotent per mission: players already reminded about it are skipped,
 * so a re-run the same day sends nothing new.
 */

const MAX_ROWS = 50_000

export async function sendDailyQuestReminders(now = Date.now(), opts: { dryRun?: boolean } = {})
{
    const db = createServiceClient()
    const { data: comps } = await db.from('competitions').select('id, slug, season_start, season_end, weeks').eq('format', 'world').eq('status', 'live')
    const summary: { slug: string; mission: string; sent: number }[] = []

    for (const c of (comps ?? []) as { id: string; slug: string; season_start: string | null; season_end: string | null; weeks: number }[])
    {
        const clock = semesterClock(c.season_start, c.season_end, c.weeks, now)
        if (clock.phase !== 'running' || !clock.week || !clock.day) continue
        const today = (await loadMissionRows(c.id)).filter((m) => m.week === clock.week && m.day === clock.day)

        for (const m of today)
        {
            const [{ data: players }, { data: reminded }, { data: started }] = await Promise.all([
                db.from('competition_participants').select('user_id').eq('competition_id', c.id).eq('pathway', m.pathway).limit(MAX_ROWS),
                db.from('notifications').select('user_id').eq('reference_id', m.id).eq('reference_type', 'world_quest').limit(MAX_ROWS),
                db.from('competition_attempts').select('user_id').eq('mission_id', m.id).limit(MAX_ROWS),
            ])
            const skip = new Set([...((reminded ?? []) as { user_id: string }[]), ...((started ?? []) as { user_id: string }[])].map((r) => r.user_id))
            const boss = m.kind === 'boss'
            const notices: WorldNotice[] = ((players ?? []) as { user_id: string }[])
                .filter((p) => !skip.has(p.user_id))
                .map((p) => ({
                    userId: p.user_id, referenceId: m.id, referenceType: 'world_quest',
                    title: boss ? `Boss challenge is live: ${m.title}` : `Today’s quest: ${m.title}`,
                    body: boss
                        ? `Bring this week’s work together. Judges score it, worth ${m.xp} XP and ${m.tokens} HubTokens.`
                        : `About ${m.est_minutes} minutes, worth ${m.xp} XP and ${m.tokens} HubTokens.`,
                    url: `/app/competitions/${c.slug}/missions/${m.id}`,
                }))
            summary.push({ slug: c.slug, mission: m.key, sent: opts.dryRun ? notices.length : await notifyWorld(notices) })
        }
    }
    return summary
}
