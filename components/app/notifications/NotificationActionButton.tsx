'use client'

import Link from 'next/link'
import type { NotificationType } from '@/lib/types'

interface Props {
  type: NotificationType
  referenceId: string | null
}

export default function NotificationActionButton({
  type,
  referenceId,
}: Props) {
  const getRoute = () => {
    switch (type) {
      case 'follow':
        return `/app/profile/${referenceId}`

      case 'reaction':
      case 'comment':
      case 'mention':
        return `/app/feed/${referenceId}`

      case 'loan_approved':
        return '/app/loans'

      case 'ajo_contribution':
        return '/app/ajo'

      default:
        return '/app'
    }
  }

  const label = {
    follow: 'View Profile',
    reaction: 'View Post',
    comment: 'View Post',
    mention: 'View Post',
    loan_approved: 'View Loan',
    ajo_contribution: 'View Ajo',
  }[type] ?? 'Open'

  return (
    <Link
      href={getRoute()}
      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
    >
      {label}
    </Link>
  )
}