'use client'

import
    {
        UserPlus,
        Heart,
        MessageCircle,
        AtSign,
        Bell,
        TrendingUp,
        CheckCircle,
        AlertTriangle,
        CreditCard,
        Flag,
    } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { NotificationWithActor, NotificationType } from '@/lib/types'

// ─── Relative time helper ────────────────────────────────────────────────────

function timeAgo(dateString: string): string
{
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const diff = Math.floor((now - then) / 1000) // seconds

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateString).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
    })
}

// ─── Icon + action text by notification type ────────────────────────────────

interface TypeConfig
{
    Icon: React.ElementType
    colour: string
    getText: (actorName: string | null) => string
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
    follow: {
        Icon: UserPlus,
        colour: 'text-primary',
        getText: (n) => `${n ?? 'Someone'} started following you`,
    },
    reaction: {
        Icon: Heart,
        colour: 'text-rose-500',
        getText: (n) => `${n ?? 'Someone'} reacted to your post`,
    },
    comment: {
        Icon: MessageCircle,
        colour: 'text-blue-500',
        getText: (n) => `${n ?? 'Someone'} commented on your post`,
    },
    mention: {
        Icon: AtSign,
        colour: 'text-purple-500',
        getText: (n) => `${n ?? 'Someone'} mentioned you in a post`,
    },
    ajo_contribution: {
        Icon: TrendingUp,
        colour: 'text-emerald-500',
        getText: () => 'An Ajo contribution was made in your group',
    },
    ajo_payout: {
        Icon: CreditCard,
        colour: 'text-emerald-600',
        getText: () => 'You received an Ajo payout',
    },
    loan_approved: {
        Icon: CheckCircle,
        colour: 'text-green-500',
        getText: () => 'Your loan application was approved',
    },
    loan_overdue: {
        Icon: AlertTriangle,
        colour: 'text-amber-500',
        getText: () => 'Your loan repayment is overdue',
    },
    goal_achieved: {
        Icon: CheckCircle,
        colour: 'text-primary',
        getText: () => 'You reached your savings goal!',
    },
    dispute_raised: {
        Icon: Flag,
        colour: 'text-red-500',
        getText: () => 'A dispute was raised in your group',
    },
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NotificationItemProps
{
    notification: NotificationWithActor
}

export default function NotificationItem({ notification }: NotificationItemProps)
{
    const config = TYPE_CONFIG[notification.type] ?? {
        Icon: Bell,
        colour: 'text-muted-foreground',
        getText: () => 'You have a new notification',
    }

    const { Icon, colour, getText } = config
    const actorName = notification.actor?.display_name ?? notification.actor?.username ?? null
    const actionText = getText(actorName)

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                }`}
        >
            {/* Unread dot */}
            <div className="flex-shrink-0 w-2 flex items-center justify-center pt-2">
                {!notification.read && (
                    <span className="block h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                )}
            </div>

            {/* Actor avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage
                    src={notification.actor?.avatar_url ?? undefined}
                    alt={actorName ?? 'User'}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(actorName)}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                    {actorName && (
                        <span className="font-semibold">{actorName} </span>
                    )}
                    <span>{actorName ? actionText.replace(actorName + ' ', '') : actionText}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(notification.created_at)}
                </p>
            </div>

            {/* Type icon */}
            <div className={`flex-shrink-0 pt-0.5 ${colour}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
        </div>
    )
}
