'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
    UserPlus,
    Heart,
    MessageCircle,
    AtSign,
    Share2,
    TrendingUp,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Flag,
    BriefcaseBusiness,
    GraduationCap,
    Store,
    Bell,
    Ellipsis,
    Eye,
    Trash2,
    BellOff,
    X,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import type {
    NotificationWithActor,
    NotificationType,
} from '@/lib/types'

function timeAgo(dateString: string): string {
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const diff = Math.floor((now - then) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

    return new Date(dateString).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
    })
}

interface TypeConfig {
    Icon: React.ElementType
    colour: string
    iconBackground: string
    label: string
    getText: (actorName: string | null) => string
}

const TYPE_CONFIG: Partial<Record<NotificationType, TypeConfig>> = {
    // Social
    follow: {
        Icon: UserPlus,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'New Follower',
        getText: (name) => `${name ?? 'Someone'} started following you.`,
    },
    new_follower: {
        Icon: UserPlus,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'New Follower',
        getText: (name) => `${name ?? 'Someone'} started following you.`,
    },
    reaction: {
        Icon: Heart,
        colour: 'text-rose-500',
        iconBackground: 'bg-rose-50',
        label: 'Post Engagement',
        getText: (name) => `${name ?? 'Someone'} reacted to your post.`,
    },
    post_reaction: {
        Icon: Heart,
        colour: 'text-rose-500',
        iconBackground: 'bg-rose-50',
        label: 'Post Engagement',
        getText: (name) => `${name ?? 'Someone'} reacted to your post.`,
    },
    comment: {
        Icon: MessageCircle,
        colour: 'text-blue-500',
        iconBackground: 'bg-blue-50',
        label: 'Post Comment',
        getText: (name) => `${name ?? 'Someone'} commented on your post.`,
    },
    post_comment: {
        Icon: MessageCircle,
        colour: 'text-blue-500',
        iconBackground: 'bg-blue-50',
        label: 'Post Comment',
        getText: (name) => `${name ?? 'Someone'} commented on your post.`,
    },
    comment_reaction: {
        Icon: Heart,
        colour: 'text-rose-500',
        iconBackground: 'bg-rose-50',
        label: 'Comment Engagement',
        getText: (name) => `${name ?? 'Someone'} reacted to your comment.`,
    },
    mention: {
        Icon: AtSign,
        colour: 'text-purple-500',
        iconBackground: 'bg-purple-50',
        label: 'Mention',
        getText: (name) => `${name ?? 'Someone'} mentioned you in a post.`,
    },
    post_share: {
        Icon: Share2,
        colour: 'text-sky-600',
        iconBackground: 'bg-sky-50',
        label: 'Post Shared',
        getText: (name) => `${name ?? 'Someone'} shared your post.`,
    },

    // Funding
    funding_contribution: {
        Icon: TrendingUp,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Funding Contribution',
        getText: (name) => `${name ?? 'Someone'} contributed to your funding campaign.`,
    },
    funding_milestone: {
        Icon: TrendingUp,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Funding Milestone',
        getText: () => 'Your funding campaign reached a milestone.',
    },
    funding_ended: {
        Icon: CheckCircle,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Funding Completed',
        getText: () => 'Your funding campaign has ended.',
    },

    // Learning
    course_published: {
        Icon: GraduationCap,
        colour: 'text-violet-600',
        iconBackground: 'bg-violet-50',
        label: 'New Course Available',
        getText: (name) => `${name ?? 'A new course'} is now available on Hubnovo Learn.`,
    },
    course_enrollment: {
        Icon: GraduationCap,
        colour: 'text-violet-600',
        iconBackground: 'bg-violet-50',
        label: 'Course Enrollment',
        getText: (name) => `${name ?? 'Someone'} enrolled in your course.`,
    },
    course_completed: {
        Icon: GraduationCap,
        colour: 'text-violet-600',
        iconBackground: 'bg-violet-50',
        label: 'Course Completed',
        getText: (name) => `${name ?? 'A learner'} completed your course.`,
    },

    // Services
    service_request: {
        Icon: BriefcaseBusiness,
        colour: 'text-amber-600',
        iconBackground: 'bg-amber-50',
        label: 'Service Request',
        getText: (name) => `${name ?? 'Someone'} requested your service.`,
    },
    service_completed: {
        Icon: CheckCircle,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Service Completed',
        getText: () => 'Your service request was completed.',
    },
    service_review: {
        Icon: MessageCircle,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'Service Review',
        getText: (name) => `${name ?? 'Someone'} left a review for your service.`,
    },

    // Ajo / loans / savings / disputes
    ajo_contribution: {
        Icon: TrendingUp,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Ajo Contribution',
        getText: () => 'An Ajo contribution was made in your group.',
    },
    ajo_payout: {
        Icon: CreditCard,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Ajo Payout',
        getText: () => 'You received an Ajo payout.',
    },
    loan_approved: {
        Icon: CheckCircle,
        colour: 'text-green-600',
        iconBackground: 'bg-green-50',
        label: 'Loan Approved',
        getText: () => 'Your loan application was approved.',
    },
    loan_overdue: {
        Icon: AlertTriangle,
        colour: 'text-amber-600',
        iconBackground: 'bg-amber-50',
        label: 'Loan Overdue',
        getText: () => 'Your loan repayment is overdue.',
    },
    goal_achieved: {
        Icon: CheckCircle,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Savings Goal Achieved',
        getText: () => 'You reached your savings goal.',
    },
    dispute_raised: {
        Icon: Flag,
        colour: 'text-red-600',
        iconBackground: 'bg-red-50',
        label: 'Dispute Raised',
        getText: () => 'A dispute was raised in your group.',
    },

    // Wallet / transactions
    wallet_deposit: {
        Icon: CreditCard,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Wallet Deposit',
        getText: () => 'Funds were credited to your Hubnovo wallet.',
    },
    wallet_withdrawal: {
        Icon: CreditCard,
        colour: 'text-orange-600',
        iconBackground: 'bg-orange-50',
        label: 'Wallet Withdrawal',
        getText: () => 'A withdrawal was made from your Hubnovo wallet.',
    },
    transaction_received: {
        Icon: CreditCard,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Money Received',
        getText: (name) => `You received money from ${name ?? 'someone'}.`,
    },
    transaction_sent: {
        Icon: CreditCard,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'Money Sent',
        getText: (name) => `You sent money to ${name ?? 'someone'}.`,
    },
    transaction_payment_success: {
        Icon: CheckCircle,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Payment Successful',
        getText: () => 'Your payment was completed successfully.',
    },
    transaction_payment_failed: {
        Icon: AlertTriangle,
        colour: 'text-red-600',
        iconBackground: 'bg-red-50',
        label: 'Payment Failed',
        getText: () => 'Your payment could not be completed.',
    },
    transaction_pending: {
        Icon: AlertTriangle,
        colour: 'text-amber-600',
        iconBackground: 'bg-amber-50',
        label: 'Payment Pending',
        getText: () => 'Your payment is still being processed.',
    },

    // Opportunities / updates
    opportunity_funding: {
        Icon: TrendingUp,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Funding Opportunity',
        getText: () => 'A new funding opportunity may be relevant to you.',
    },
    opportunity_job: {
        Icon: BriefcaseBusiness,
        colour: 'text-green-600',
        iconBackground: 'bg-green-50',
        label: 'Job Opportunity',
        getText: () => 'A new job opportunity matches your profile.',
    },
    opportunity_scholarship: {
        Icon: GraduationCap,
        colour: 'text-violet-600',
        iconBackground: 'bg-violet-50',
        label: 'Scholarship Opportunity',
        getText: () => 'A new scholarship opportunity is available.',
    },
    opportunity_grant: {
        Icon: TrendingUp,
        colour: 'text-emerald-600',
        iconBackground: 'bg-emerald-50',
        label: 'Grant Opportunity',
        getText: () => 'A new grant opportunity is available.',
    },
    opportunity_business: {
        Icon: Store,
        colour: 'text-orange-600',
        iconBackground: 'bg-orange-50',
        label: 'Business Opportunity',
        getText: () => 'A new business opportunity is available.',
    },
    opportunity_deadline: {
        Icon: AlertTriangle,
        colour: 'text-amber-600',
        iconBackground: 'bg-amber-50',
        label: 'Opportunity Deadline',
        getText: () => 'An opportunity deadline is approaching.',
    },
    update_platform: {
        Icon: Bell,
        colour: 'text-slate-600',
        iconBackground: 'bg-slate-50',
        label: 'Platform Update',
        getText: () => 'We have an update about the Hubnovo platform.',
    },
    update_feature: {
        Icon: Bell,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'New Feature',
        getText: () => 'A new Hubnovo feature is now available.',
    },
    update_maintenance: {
        Icon: Bell,
        colour: 'text-amber-600',
        iconBackground: 'bg-amber-50',
        label: 'Maintenance Update',
        getText: () => 'Scheduled maintenance may temporarily affect your experience.',
    },
    update_policy: {
        Icon: Bell,
        colour: 'text-slate-600',
        iconBackground: 'bg-slate-50',
        label: 'Policy Update',
        getText: () => 'Our policies have been updated.',
    },
    update_announcement: {
        Icon: Bell,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'Announcement',
        getText: () => 'There is a new announcement from Hubnovo.',
    },
    system: {
        Icon: Bell,
        colour: 'text-slate-600',
        iconBackground: 'bg-slate-50',
        label: 'System Update',
        getText: () => 'We have an important update for you.',
    },
    welcome: {
        Icon: Bell,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'Welcome',
        getText: () => 'Welcome to Hubnovo. We are glad to have you here.',
    },
    chat_message: {
        Icon: MessageCircle,
        colour: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        label: 'New Message',
        getText: (name) => `${name ?? 'Someone'} sent you a message.`,
    },
}

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U'

    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

interface NotificationItemProps {
    notification: NotificationWithActor
    onRead?: (notificationId: string) => void
    onMarkUnread?: (notificationId: string) => void
    onDelete?: (notificationId: string) => void
    onMute?: (type: NotificationType) => void
}

export default function NotificationItem({
    notification,
    onRead,
    onMarkUnread,
    onDelete,
    onMute,
}: NotificationItemProps) {
    const router = useRouter()

    const [menuOpen, setMenuOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [relativeTime, setRelativeTime] = useState('')

    // Relative time depends on Date.now(), so calculate it only after
    // hydration. This prevents the server and browser from rendering
    // different values such as "11h ago" vs "12h ago".
    useEffect(() => {
        if (!notification.created_at) return

        const updateRelativeTime = () => {
            setRelativeTime(timeAgo(notification.created_at!))
        }

        updateRelativeTime()

        const interval = window.setInterval(updateRelativeTime, 60_000)

        return () => window.clearInterval(interval)
    }, [notification.created_at])

    const config = TYPE_CONFIG[notification.type] ?? {
        Icon: Bell,
        colour: 'text-slate-600',
        iconBackground: 'bg-slate-50',
        label: 'Notification',
        getText: () => 'You have a new notification.',
    }

    const {
        Icon,
        colour,
        iconBackground,
        label,
        getText,
    } = config

    const actorName =
        notification.actor?.display_name ??
        notification.actor?.username ??
        null

    const actionText = getText(actorName)

    /*
     * Every notification has a destination.
     *
     * reference_id is the entity ID supplied when the notification is
     * created. Social notifications are the only ones that use the
     * actor's username for the profile destination.
     *
     * Keep this mapping in one place so clicking the notification row
     * and clicking its action button always do the same thing.
     */
    const getNotificationDestination = (): {
        href: string | null
        label: string
    } => {
        const referenceId = notification.reference_id

        switch (notification.type) {
            // ─── Profiles ─────────────────────────────────────────────
            case 'follow':
            case 'new_follower': {
                const username = notification.actor?.username
                return {
                    href: username ? `/app/profile/${username}` : null,
                    label: 'View Profile',
                }
            }

            // ─── Posts ────────────────────────────────────────────────
            case 'reaction':
            case 'post_reaction':
            case 'comment':
            case 'post_comment':
            case 'comment_reaction':
            case 'mention':
            case 'post_share':
                return {
                    href: referenceId ? `/app/feed/${referenceId}` : null,
                    label: 'View Post',
                }

            // ─── Courses ──────────────────────────────────────────────
            case 'course_published':
            case 'course_enrollment':
            case 'course_completed':
                return {
                    href: referenceId ? `/app/learn/${referenceId}` : '/app/learn',
                    label: 'View Course',
                }

            // ─── Funding ──────────────────────────────────────────────
            case 'funding_contribution':
            case 'funding_milestone':
            case 'funding_ended':
                return {
                    href: referenceId
                        ? `/app/funding/${referenceId}`
                        : '/app/funding',
                    label: referenceId ? 'View Campaign' : 'View Funding',
                }

            // ─── Services ─────────────────────────────────────────────
            case 'service_request':
            case 'service_completed':
            case 'service_review':
                return {
                    href: referenceId
                        ? `/app/services/${referenceId}`
                        : '/app/services',
                    label: referenceId ? 'View Service' : 'View Services',
                }

            // ─── Ajo ─────────────────────────────────────────────────
            case 'ajo_contribution':
            case 'ajo_payout':
            case 'dispute_raised':
                return {
                    href: '/app/ajo',
                    label: 'View Ajo',
                }

            // ─── Loans ────────────────────────────────────────────────
            case 'loan_approved':
            case 'loan_overdue':
                return {
                    href: referenceId
                        ? `/app/loans/${referenceId}`
                        : '/app/loans',
                    label: referenceId ? 'View Loan' : 'View Loans',
                }

            // ─── Savings ──────────────────────────────────────────────
            case 'goal_achieved':
                return {
                    href: '/app/savings',
                    label: 'View Savings',
                }

            // ─── Wallet / transactions ────────────────────────────────
            case 'wallet_deposit':
            case 'wallet_withdrawal':
            case 'transaction_received':
            case 'transaction_sent':
            case 'transaction_payment_success':
            case 'transaction_payment_failed':
            case 'transaction_pending':
                return {
                    href: '/app/wallet',
                    label: 'View Wallet',
                }

            // ─── Opportunities ────────────────────────────────────────
            case 'opportunity_funding':
            case 'opportunity_job':
            case 'opportunity_scholarship':
            case 'opportunity_grant':
            case 'opportunity_business':
            case 'opportunity_deadline':
                return {
                    href: referenceId
                        ? `/app/opportunities/${referenceId}`
                        : '/app/opportunities',
                    label: referenceId
                        ? 'View Opportunity'
                        : 'View Opportunities',
                }

            // ─── Chat ─────────────────────────────────────────────────
            case 'chat_message':
                return {
                    href: '/app/messages',
                    label: 'View Message',
                }

            // ─── Platform/system notifications ────────────────────────
            // These don't point to a specific entity, so take the user
            // back to the notifications area.
            case 'update_platform':
            case 'update_feature':
            case 'update_maintenance':
            case 'update_policy':
            case 'update_announcement':
            case 'system':
            case 'welcome':
            default:
                return {
                    href: '/app/notifications',
                    label: 'View Notification',
                }
        }
    }

    const notificationDestination = getNotificationDestination()
    const actionLabel = notificationDestination.href
        ? notificationDestination.label
        : null

    const handleNotificationAction = () => {
        const href = notificationDestination.href
        if (!href) return

        if (!notification.read && onRead) {
            onRead(notification.id)
        }

        router.push(href)
    }

    const handleClick = () => {
        if (!notification.read && onRead) {
            onRead(notification.id)
        }

        handleNotificationAction()
    }

    const handleMarkUnread = () => {
        setMenuOpen(false)
        onMarkUnread?.(notification.id)
    }

    const handleDelete = () => {
        setMenuOpen(false)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = () => {
        setDeleteConfirmOpen(false)
        onDelete?.(notification.id)
    }

    const cancelDelete = () => {
        setDeleteConfirmOpen(false)
    }

    const handleMute = () => {
        setMenuOpen(false)
        onMute?.(notification.type)
    }

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={notificationDestination.href ? 0 : undefined}
            onKeyDown={(event) => {
                if (
                    notificationDestination.href &&
                    (event.key === 'Enter' || event.key === ' ')
                ) {
                    event.preventDefault()
                    handleClick()
                }
            }}
            className={`group relative flex items-start gap-3 border-b border-border/60 px-4 py-4 transition-colors sm:px-6 ${
                notification.read
                    ? 'bg-background hover:bg-muted/40'
                    : 'bg-primary/[0.04] hover:bg-primary/[0.07]'
                } ${notificationDestination.href ? 'cursor-pointer' : ''}            }`}
        >
            {/* Unread indicator */}
            <div className="flex w-2 flex-shrink-0 items-center justify-center pt-2">
                {!notification.read && (
                    <span
                        className="h-2 w-2 rounded-full bg-primary"
                        aria-label="Unread"
                    />
                )}
            </div>

            {/* Notification type icon — matches the screenshot */}
            <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${iconBackground} ${colour}`}
            >
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            {/* Main notification content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h3
                        className={`truncate text-sm font-semibold ${
                            notification.read
                                ? 'text-foreground'
                                : 'text-foreground'
                        }`}
                    >
                        {label}
                    </h3>
                </div>

                <p
                    className={`mt-1 text-xs leading-relaxed sm:text-sm ${
                        notification.read
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground'
                    }`}
                >
                    {actionText}
                </p>

                {/* Time */}
                {notification.created_at && (
                    <div className="mt-3 flex items-center">
                        <time
                            dateTime={notification.created_at}
                            className="whitespace-nowrap text-xs text-muted-foreground"
                        >
                            {relativeTime || 'Just now'}
                        </time>
                    </div>
                )}
            </div>

            {/* Right-side actions — View action sits close to the 3 dots */}
            <div className="relative flex flex-shrink-0 items-start gap-2">
                {actionLabel && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            handleNotificationAction()
                        }}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                        {actionLabel}
                    </button>
                )}

                <button
                    type="button"
                    aria-label="Notification actions"
                    aria-expanded={menuOpen}
                    onClick={(event) => {
                        event.stopPropagation()
                        setMenuOpen((open) => !open)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <Ellipsis className="h-4 w-4" />
                </button>

                {menuOpen && (
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg"
                    >
                        <button
                            type="button"
                            onClick={
                                notification.read
                                    ? handleMarkUnread
                                    : () => {
                                          setMenuOpen(false)
                                          onRead?.(notification.id)
                                      }
                            }
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                        >
                            <Eye className="h-4 w-4" />
                            {notification.read
                                ? 'Mark as unread'
                                : 'Mark as read'}
                        </button>

                        <button
                            type="button"
                            onClick={handleMute}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                        >
                            <BellOff className="h-4 w-4" />
                            Mute this type
                        </button>

                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            {deleteConfirmOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
                    onClick={cancelDelete}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-notification-title"
                        className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3
                                    id="delete-notification-title"
                                    className="text-base font-semibold text-foreground"
                                >
                                    Delete notification?
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    This notification will be permanently removed.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close"
                                onClick={cancelDelete}
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}