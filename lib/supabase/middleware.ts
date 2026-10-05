import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Helper to ensure ALL session and refresh cookies are preserved on redirect responses
  const redirectWithCookies = (destination: URL | string) => {
    let target: URL
    if (typeof destination === 'string') {
      target = request.nextUrl.clone()
      if (destination.startsWith('/')) {
        const [path, query] = destination.split('?')
        target.pathname = path
        target.search = query ? `?${query}` : ''
      } else {
        target = new URL(destination)
      }
    } else {
      target = destination
    }
    const response = NextResponse.redirect(target)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  // 1. OAuth code catch-all:
  // If Supabase redirects an OAuth callback (e.g. Google) to the Site URL root '/' with '?code=...',
  // intercept it immediately and forward to '/auth/callback' so it exchanges the code for a session
  // and redirects straight to /app!
  // Only the root: that's where Supabase's Site URL fallback lands. Catching
  // `?code=` on every path would hijack any other page using a `code` param.
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/') {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    return redirectWithCookies(callbackUrl)
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /app routes — carry the original destination through as `next`
  // so login can send the user back where they were headed.
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    const originalDestination = `${request.nextUrl.pathname}${request.nextUrl.search}`
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    url.searchParams.set('next', originalDestination)
    return redirectWithCookies(url)
  }

  // Onboarding redirect: authenticated user on /app/* who hasn't completed onboarding.
  // `onboarded` only ever flips false -> true, never back, so once we've
  // confirmed it via the DB we cache it in a cookie and skip this query on
  // every subsequent navigation for as long as the cookie is present.
  if (user && request.nextUrl.pathname.startsWith('/app')) {
    if (!request.nextUrl.pathname.startsWith('/app/settings/onboarding')) {
      const alreadyOnboarded = request.cookies.get('onboarded')?.value === '1'

      if (!alreadyOnboarded) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, auth_id, onboarded, display_name, fullname, username')
          .or(`auth_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle()

        // Check if user is truly onboarded:
        // Either onboarded flag is true, OR user has an existing active profile
        // (a custom username not starting with user_ and a display/full name).
        const isOnboarded = Boolean(
          profile && (
            profile.onboarded ||
            (profile.username && !profile.username.startsWith('user_') && (profile.display_name || profile.fullname))
          )
        )

        // No row at all (first-time OAuth sign-in, e.g. Google) or incomplete
        // profile counts as not onboarded — send to onboarding.
        if (!isOnboarded) {
          const url = request.nextUrl.clone()
          url.pathname = '/app/settings/onboarding'
          return redirectWithCookies(url)
        }

        // Auto-heal in background if profile.onboarded was false or auth_id was unlinked
        if (profile && (!profile.onboarded || profile.auth_id !== user.id)) {
          supabase
            .from('users')
            .update({ onboarded: true, auth_id: user.id })
            .eq('id', profile.id)
            .then(() => {})
        }

        supabaseResponse.cookies.set('onboarded', '1', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        })
      }
    }
  }

  // Redirect authenticated users away from auth pages and landing page root '/'
  // Exception: allow /auth/reset-password and /auth/verify so users can complete
  // OTP verification and onboarding transition
  if (user) {
    if (request.nextUrl.pathname.startsWith('/auth')) {
      if (
        request.nextUrl.pathname.startsWith('/auth/reset-password') ||
        request.nextUrl.pathname.startsWith('/auth/verify')
      ) {
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      return redirectWithCookies(url)
    }

    // If already authenticated and landing on the root page '/', navigate directly to /app
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      return redirectWithCookies(url)
    }
  }

  return supabaseResponse
}

