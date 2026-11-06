'use client'

import {
    Bell,
    CheckCheck,
    Heart,
    MessageCircle,
    AtSign,
    Users,
    Wallet,
    BriefcaseBusiness,
    Megaphone,
} from 'lucide-react'

export type FilterKey =
    | 'all'
    | 'unread'
    | 'follows'
    | 'reactions'
    | 'comments'
    | 'mentions'
    | 'ajo'
    | 'loans'
    | 'savings'
    | 'disputes'
    | 'transactions'
    | 'opportunities'
    | 'updates'

interface NotificationFilter {
    key: FilterKey
    label: string
    icon: React.ElementType
    types?: string[]
}

export const NOTIFICATION_FILTERS: NotificationFilter[] = [
    {
        key: 'all',
        label: 'All',
        icon: Bell,
    },
    {
        key: 'unread',
        label: 'Unread',
        icon: CheckCheck,
    },
    {
        key: 'follows',
        label: 'Follows',
        icon: Users,
        types: ['new_follower', 'follow'],
    },
    {
        key: 'reactions',
        label: 'Reactions',
        icon: Heart,
        types: ['post_reaction', 'reaction', 'comment_reaction'],
    },
    {
        key: 'comments',
        label: 'Comments',
        icon: MessageCircle,
        types: ['post_comment', 'comment'],
    },
    {
        key: 'mentions',
        label: 'Mentions',
        icon: AtSign,
        types: ['mention'],
    },
    {
        key: 'ajo',
        label: 'Ajo',
        icon: Users,
        types: ['ajo_contribution', 'ajo_payout'],
    },
    {
        key: 'loans',
        label: 'Loans',
        icon: Wallet,
        types: ['loan_approved', 'loan_overdue'],
    },
    {
        key: 'savings',
        label: 'Savings',
        icon: Wallet,
        types: ['goal_achieved'],
    },
    {
        key: 'disputes',
        label: 'Disputes',
        icon: Megaphone,
        types: ['dispute_raised'],
    },

    // ─── Transactions ─────────────────────────────────────────────────────────
    {
        key: 'transactions',
        label: 'Transactions',
        icon: Wallet,
        types: [
            'wallet_deposit',
            'wallet_withdrawal',
            'transaction_received',
            'transaction_sent',
            'transaction_payment_success',
            'transaction_payment_failed',
            'transaction_pending',
        ],
    },

    // ─── Opportunities ─────────────────────────────────────────────────────────
    {
        key: 'opportunities',
        label: 'Opportunities',
        icon: BriefcaseBusiness,
        types: [
            'opportunity_funding',
            'opportunity_job',
            'opportunity_scholarship',
            'opportunity_grant',
            'opportunity_business',
            'opportunity_deadline',
        ],
    },

    // ─── Updates ───────────────────────────────────────────────────────────────
    {
        key: 'updates',
        label: 'Updates',
        icon: Megaphone,
        types: [
            'system',
            'update_platform',
            'update_feature',
            'update_maintenance',
            'update_policy',
            'update_announcement',
        ],
    },
]

interface NotificationFiltersProps {
    activeFilter: FilterKey
    onFilterChange: (filter: FilterKey) => void
    unreadCount: number
}

export default function NotificationFilters({
    activeFilter,
    onFilterChange,
    unreadCount,
}: NotificationFiltersProps) {
    return (
        <div className="border-b border-border bg-background px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
                {NOTIFICATION_FILTERS.map((filter) => {
                    const Icon = filter.icon
                    const active = activeFilter === filter.key

                    return (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={() => onFilterChange(filter.key)}
                            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {filter.label}

                            {filter.key === 'unread' && unreadCount > 0 && (
                                <span
                                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        active
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-primary/10 text-primary'
                                    }`}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}