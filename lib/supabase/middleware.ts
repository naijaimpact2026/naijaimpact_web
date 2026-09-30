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

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /app routes — carry the original destination through as `next`
  // so login can send the user back where they were headed.
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    const originalDestination = `${request.nextUrl.pathname}${request.nextUrl.search}`
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    url.searchParams.set('next', originalDestination)
    return NextResponse.redirect(url)
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
          .select('onboarded')
          .eq('auth_id', user.id)
          .maybeSingle()

        // No row at all (first-time OAuth sign-in, e.g. Google) counts as
        // not onboarded too — completeOnboarding() creates the row.
        if (!profile || !profile.onboarded) {
          const url = request.nextUrl.clone()
          url.pathname = '/app/settings/onboarding'
          return NextResponse.redirect(url)
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

  // Redirect authenticated users away from auth pages
  // Exception: allow /auth/reset-password so users can set their new password
  // after OTP verification (Supabase signs them in during verifyOtp)
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    if (request.nextUrl.pathname.startsWith('/auth/reset-password')) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
