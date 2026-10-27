import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export const RATE_LIMITED = 'Too many attempts. Please wait a few minutes and try again.'

/** Caller IP (Vercel sets x-real-ip / x-forwarded-for). */
export async function clientIp(request?: Request): Promise<string>
{
    const h = request ? request.headers : await headers()
    return (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim()
}

/**
 * Counts a hit against `key` and returns true while it stays within `max`
 * hits per `windowSeconds` (fixed window, stored in Postgres so it holds
 * across serverless instances). `failOpen` lets auth flows keep working if
 * the limiter itself errors; money flows should stay closed.
 */
export async function rateLimit(
    key: string,
    max: number,
    windowSeconds: number,
    { failOpen = false }: { failOpen?: boolean } = {},
): Promise<boolean>
{
    const { data, error } = await createServiceClient().rpc('rate_limit_hit', {
        p_key: key,
        p_max: max,
        p_window_seconds: windowSeconds,
    })
    if (error)
    {
        console.error('rateLimit error:', error.message)
        return failOpen
    }
    return data === true
}
