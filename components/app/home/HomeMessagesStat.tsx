'use client'

import { useUnreadCount } from '@/components/app/UnreadCountContext'

/** Live "new messages" number for the Home profile mini-card, backed by the same
 *  real-time context that drives the sidebar's Messages badge. */
export default function HomeMessagesStat()
{
    const { messageCount } = useUnreadCount()
    return <>{messageCount}</>
}
