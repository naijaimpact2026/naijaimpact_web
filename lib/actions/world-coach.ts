'use server'

import { getCurrentUser } from '@/lib/supabase/auth'
import { getActingProfile } from '@/lib/modushive/acting-profile'
import { askCoach, type CoachTurn } from '@/lib/world/coach'

/* Web server action for the Campus coach. All checks live in lib/world/coach.ts (also used by the REST route). */
export async function askCampusCoachAction(slug: string, missionId: string, message: string, history: CoachTurn[])
{
    const profile = getActingProfile() ?? (await getCurrentUser()).profile
    if (!profile) return { ok: false as const, error: 'Please sign in again.' }
    return askCoach(slug, missionId, profile, { message, history })
}
