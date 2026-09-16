'use client'

import NotificationItem from './NotificationItem'
import type { NotificationWithActor } from '@/lib/types'

interface Props {
  title: string
  notifications: NotificationWithActor[]
  onRead: (id: string) => void
}

export default function NotificationGroup({
  title,
  notifications,
  onRead,
}: Props) {
  return (
    <div>
      <div className="sticky top-[112px] z-10 bg-background px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>

      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          notification={item}
          onRead={onRead}
        />
      ))}
    </div>
  )
}