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

      case 'funding_contribution':
      case 'funding_milestone':
      case 'funding_ended':
        return referenceId ? `/app/funding/${referenceId}` : '/app/funding'

      default:
        return '/app'
    }
  }

  const labels: Partial<Record<NotificationType, string>> = {
    follow: 'View Profile',
    new_follower: 'View Profile',
    reaction: 'View Post',
    post_reaction: 'View Post',
    comment: 'View Post',
    post_comment: 'View Post',
    mention: 'View Post',
    loan_approved: 'View Loan',
    ajo_contribution: 'View Ajo',
    funding_contribution: 'View Campaign',
    funding_milestone: 'View Campaign',
  }

  const label = labels[type] ?? 'Open'

  return (
    <Link
      href={getRoute()}
      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
    >
      {label}
    </Link>
  )
}