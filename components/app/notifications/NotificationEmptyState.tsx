'use client'

import {
    Bell,
    CheckCheck,
} from 'lucide-react'

import type { FilterKey } from './NotificationFilters'

interface NotificationEmptyStateProps {
    filter: FilterKey
}

const FILTER_LABELS: Record<
    FilterKey,
    string
> = {
    all: 'notifications',
    unread: 'unread notifications',
    follows: 'follow notifications',
    reactions: 'reaction notifications',
    comments: 'comment notifications',
    mentions: 'mention notifications',
    ajo: 'Ajo notifications',
    loans: 'loan notifications',
    savings: 'savings notifications',
    disputes: 'dispute notifications',
}

export default function NotificationEmptyState({
    filter,
}: NotificationEmptyStateProps) {
    const isUnread =
        filter === 'unread'

    return (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-20">
            <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    isUnread
                        ? 'bg-primary/10'
                        : 'bg-muted'
                }`}
            >
                {isUnread ? (
                    <CheckCheck className="h-8 w-8 text-primary" />
                ) : (
                    <Bell className="h-8 w-8 text-muted-foreground" />
                )}
            </div>

            <h3 className="mt-5 text-base font-semibold text-foreground">
                {isUnread
                    ? "You're all caught up"
                    : 'No notifications'}
            </h3>

            <p className="mt-1 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
                {isUnread
                    ? "You don't have any unread notifications right now."
                    : `You don't have any ${FILTER_LABELS[filter]} yet.`}
            </p>
        </div>
    )
}