/**
 * UnreadCountProvider
 *
 * Re-exports the canonical UnreadCountProvider and useUnreadCount hook
 * from UnreadCountContext. The actual context state, Supabase Realtime
 * subscriptions, and Stream Chat wiring all live in:
 *   - components/app/UnreadCountContext.tsx   (context + provider)
 *   - components/app/NotificationListener.tsx (Supabase Realtime → setNotificationCount)
 *   - components/app/ChatProvider.tsx         (Stream Chat → setMessageCount)
 *
 * This file exists so imports of `UnreadCountProvider` resolve correctly
 * regardless of which path is used.
 */

export { UnreadCountProvider, useUnreadCount } from './UnreadCountContext'
export { UnreadCountProvider as default } from './UnreadCountContext'
