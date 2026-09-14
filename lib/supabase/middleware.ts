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

  // Protect /app routes
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Onboarding redirect: authenticated user on /app/* who hasn't completed onboarding
  if (user && request.nextUrl.pathname.startsWith('/app')) {
    if (!request.nextUrl.pathname.startsWith('/app/settings/onboarding')) {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarded')
        .eq('auth_id', user.id)
        .single()

      if (profile && !profile.onboarded) {
        const url = request.nextUrl.clone()
        url.pathname = '/app/settings/onboarding'
        return NextResponse.redirect(url)
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
