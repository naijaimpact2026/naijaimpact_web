import { StreamChat } from 'stream-chat'

let client: StreamChat | null = null

/**
 * Returns a singleton StreamChat client for browser use.
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
export function getStreamClient(): StreamChat {
  // Prefer the explicit public alias; fall back to the original env var
  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_API_KEY ||
    process.env.NEXT_PUBLIC_STREAM_KEY!

  if (!client) {
    client = StreamChat.getInstance(apiKey)
  }
  return client
}
