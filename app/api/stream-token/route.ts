import { NextResponse } from 'next/server'
import { StreamClient } from '@stream-io/node-sdk'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Verify Supabase session
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the user's profile to get their platform user ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Generate Stream token server-side.
    // IMPORTANT: must use the key whose secret we actually have.
    // STREAM_API_KEY + STREAM_SECRET_KEY are the matched server-side pair.
    // The browser client in lib/stream.ts is updated to use STREAM_API_KEY too.
    const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY!
    const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET!

    console.log('[stream-token] Using API key:', apiKey, '| Secret defined:', !!apiSecret)

    const streamClient = new StreamClient(apiKey, apiSecret)
    // generateUserToken accepts a payload with user_id
    const token = streamClient.generateUserToken({ user_id: profile.id })

    return NextResponse.json({ token })
  } catch (err) {
    console.error('[stream-token] Error generating token:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
