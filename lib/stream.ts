import type { StreamChat } from 'stream-chat'

let client: StreamChat | null = null

/**
 * Returns a singleton StreamChat client for browser use.
 *
 * The `stream-chat` SDK is dynamically imported so it's code-split out of
 * the initial bundle — ChatProvider (which calls this) is mounted on every
 * route via AppShell just to drive the sidebar unread badge, so without
 * this every page load shipped the whole chat SDK whether or not the user
 * ever opens chat.
 *
 * We use NEXT_PUBLIC_STREAM_API_KEY which must match the server-side
 * STREAM_API_KEY used to sign tokens in /api/stream-token.
 *
 * In .env.local set:
 *   NEXT_PUBLIC_STREAM_API_KEY=crq9ptap24fb   ← same as STREAM_API_KEY
 *   STREAM_API_KEY=crq9ptap24fb
 *   STREAM_SECRET_KEY=tcp9a4baujc7...
 *
 * (The old NEXT_PUBLIC_STREAM_KEY=r4cm2z5y42ek was a different app and its
 *  secret was not available, causing JWT validation failures.)
 */
export async function getStreamClient(): Promise<StreamChat> {
  // Prefer the explicit public alias; fall back to the original env var
  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_API_KEY ||
    process.env.NEXT_PUBLIC_STREAM_KEY!

  if (!client) {
    const { StreamChat } = await import('stream-chat')
    client = StreamChat.getInstance(apiKey)
  }
  return client
}

/**
 * Cleanly disconnects the current user session (to be used on logout).
 */
export async function disconnectChatUser(): Promise<void> {
  if (client && client.userID) {
    try {
      await client.disconnectUser()
    } catch {
      // Ignore disconnect errors during logout
    }
  }
}
