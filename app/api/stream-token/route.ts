import { NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { getRequestUser } from '@/lib/supabase/request-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify the Supabase session (cookie on web, Bearer token from the
    // mobile app) and resolve current user profile
    const { authUser, profile } = await getRequestUser(request)

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine the user ID to use for Stream Chat.
    // If a platform profile exists, use its id; otherwise fallback to authUser.id.
    const targetUserId = profile?.id || authUser.id

    // Generate Stream token server-side.
    // We match the client-side keys used by getStreamClient() in lib/stream.ts.
    const apiKey =
      process.env.STREAM_API_KEY ||
      process.env.NEXT_PUBLIC_STREAM_API_KEY ||
      process.env.NEXT_PUBLIC_STREAM_KEY!
    const apiSecret =
      process.env.STREAM_SECRET_KEY ||
      process.env.STREAM_API_SECRET!

    if (!apiKey || !apiSecret) {
      console.error('[stream-token] Stream Chat configuration missing on server')
      return NextResponse.json(
        { error: 'Stream credentials not configured' },
        { status: 500 }
      )
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret)
    // Create token with 30-day expiration so sessions remain valid and auto-refresh
    const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 3600
    const token = serverClient.createToken(targetUserId, exp)

    return NextResponse.json({ token, userId: targetUserId })
  } catch (err) {
    console.error('[stream-token] Error generating token:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

