import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserRow } from '@/lib/actions/auth'
import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const publicOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const requestedNext = searchParams.get('next') ?? '/app'

    // If this is a password recovery attempt, direct user to reset password page
    if (type === 'recovery') {
        const supabase = await createClient()
        if (token_hash) {
            const { error } = await supabase.auth.verifyOtp({
                token_hash,
                type: 'recovery',
            })
            if (!error) {
                return NextResponse.redirect(`${publicOrigin}/auth/reset-password`)
            }
        }
        if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
                return NextResponse.redirect(`${publicOrigin}/auth/reset-password`)
            }
        }
        return NextResponse.redirect(`${publicOrigin}/auth/reset-password?error=invalid_code`)
    }

    // Resolve against publicOrigin and require it to stay same-origin
    let next = '/app'
    try {
        const resolved = new URL(requestedNext, publicOrigin)
        if (resolved.origin === publicOrigin) {
            next = `${resolved.pathname}${resolved.search}${resolved.hash}`
        }
    } catch {
        // Malformed next value — fall back to '/app'
    }

    // Always send authenticated users to /app, never let them get stranded on the root landing page
    if (!next || next === '/') {
        next = '/app'
    }

    const supabase = await createClient()

    // 1. Handle token_hash from email confirmation links
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
        })

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await ensureUserRow(user, supabase as unknown as SupabaseClient)
            }
            return NextResponse.redirect(`${publicOrigin}${next}`)
        }
    }

    // 2. Handle PKCE code from OAuth (e.g. Google) or auth links
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await ensureUserRow(user, supabase as unknown as SupabaseClient)
            }
            return NextResponse.redirect(`${publicOrigin}${next}`)
        }
    }

    return NextResponse.redirect(
        `${publicOrigin}/auth/login?error=oauth`
    )
}