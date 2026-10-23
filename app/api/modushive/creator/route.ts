import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { jsonError, withProfile } from '@/lib/modushive/api'
import { canGoLive, getLiveLimits, normalizeRole } from '@/lib/modushive/config'
import { isMuxConfigured } from '@/lib/modushive/mux'
import { isCloudflareStreamConfigured } from '@/lib/modushive/cloudflare'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/modushive/creator — the mobile "Become a creator" flow (web uses
 * becomeCreatorAction). Only upgrades 'user' → 'creator', so it never
 * demotes an admin, and calling it again is a no-op.
 * → { ok, role, canGoLive, liveLimits }
 */
export async function POST(request: Request)
{
    return withProfile(request, async ({ profile }) =>
    {
        let role = normalizeRole(profile.role)

        if (role === 'user')
        {
            const { error } = await createServiceClient()
                .from('users')
                .update({ role: 'creator', updated_at: new Date().toISOString() })
                .eq('id', profile.id)
                .eq('role', 'user')

            if (error)
            {
                console.error('[modushive-api] become creator failed:', error.message)
                return jsonError('Could not activate your creator account. Please try again.', 500)
            }

            role = 'creator'
            revalidatePath('/app/modushive')
            revalidatePath('/app/modushive/studio')
        }

        return NextResponse.json({ ok: true, role, canGoLive: canGoLive(role) && (isCloudflareStreamConfigured() || isMuxConfigured()), liveLimits: getLiveLimits(role) })
    })
}
