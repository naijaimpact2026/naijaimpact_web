'use client'

import { useState } from 'react'
import {
  Ellipsis,
  Eye,
  Trash2,
  BellOff,
} from 'lucide-react'

interface Props {
  onMarkUnread: () => void
  onDelete: () => void
  onMute: () => void
}

export default function NotificationActions({
  onMarkUnread,
  onDelete,
  onMute,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 hover:bg-muted"
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border bg-background shadow-lg">
          <button
            onClick={onMarkUnread}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            Mark as unread
          </button>

          <button
            onClick={onMute}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <BellOff className="h-4 w-4" />
            Mute this type
          </button>

          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}