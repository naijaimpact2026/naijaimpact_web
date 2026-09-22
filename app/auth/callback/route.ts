import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    const requestedNext = searchParams.get('next') ?? '/app'

    // Resolve against origin and require it to stay same-origin — a plain
    // startsWith('/') check lets protocol-relative URLs like "//evil.com"
    // through, which browsers treat as an absolute redirect to another host.
    let next = '/app'
    try {
        const resolved = new URL(requestedNext, origin)
        if (resolved.origin === origin) {
            next = `${resolved.pathname}${resolved.search}${resolved.hash}`
        }
    } catch {
        // Malformed next value — fall back to '/app'
    }

    if (code) {
        const supabase = await createClient()

        const { error } =
            await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(
        `${origin}/auth/login?error=oauth`
    )
}