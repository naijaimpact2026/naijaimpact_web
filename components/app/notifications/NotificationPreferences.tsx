'use client'

import { useEffect, useState } from 'react'
import {
    Bell,
    ChevronDown,
    ChevronRight,
    Mail,
    MessageSquare,
    Settings,
} from 'lucide-react'

import { updateNotifications } from '@/lib/actions/profile'

interface NotificationPreferencesData {
    notifications_follows: boolean
    notifications_reactions: boolean
    notifications_comments: boolean
    notifications_mentions: boolean
}

interface NotificationPreferencesProps {
    preferences: NotificationPreferencesData
}

type ChannelKey = 'push' | 'email' | 'sms' | 'inApp'

const channels = [
    {
        key: 'push' as ChannelKey,
        label: 'Push Notifications',
        description: 'On',
        icon: Bell,
    },
    {
        key: 'email' as ChannelKey,
        label: 'Email Notifications',
        description: 'On',
        icon: Mail,
    },
    {
        key: 'sms' as ChannelKey,
        label: 'SMS Notifications',
        description: 'Off',
        icon: MessageSquare,
    },
    {
        key: 'inApp' as ChannelKey,
        label: 'In-App Notifications',
        description: 'On',
        icon: Bell,
    },
]

const details = [
    {
        key: 'notifications_follows' as const,
        label: 'New followers',
        description: 'When someone follows you',
    },
    {
        key: 'notifications_reactions' as const,
        label: 'Post reactions',
        description: 'When someone reacts to your posts',
    },
    {
        key: 'notifications_comments' as const,
        label: 'Comments',
        description: 'When someone comments on your posts',
    },
    {
        key: 'notifications_mentions' as const,
        label: 'Mentions',
        description: 'When someone mentions you',
    },
]

export default function NotificationPreferences({
    preferences,
}: NotificationPreferencesProps) {
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState<ChannelKey | null>(null)
    const [prefs, setPrefs] = useState(preferences)
    const [saving, setSaving] =
        useState<keyof NotificationPreferencesData | null>(null)

    useEffect(() => {
        const openPanel = () => setOpen(true)

        window.addEventListener(
            'open-notification-preferences',
            openPanel,
        )

        return () =>
            window.removeEventListener(
                'open-notification-preferences',
                openPanel,
            )
    }, [])

    const updatePreference = async (
        key: keyof NotificationPreferencesData,
        checked: boolean,
    ) => {
        const previous = prefs

        setPrefs((current) => ({
            ...current,
            [key]: checked,
        }))
        setSaving(key)

        try {
            const result = await updateNotifications({
                ...previous,
                [key]: checked,
            })

            if (!result?.success) {
                setPrefs(previous)
            }
        } catch (error) {
            console.error(
                '[NotificationPreferences] update error:',
                error,
            )
            setPrefs(previous)
        } finally {
            setSaving(null)
        }
    }

    if (!open) return null

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                onClick={() => setOpen(false)}
            />

            <section className="fixed right-4 top-20 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-background shadow-xl lg:static lg:w-full lg:shadow-sm">
                <div className="flex items-start gap-3 border-b border-border p-4">
                    <Settings className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-foreground">
                            Notification Preferences
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Choose what you want to be notified about.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-md px-2 py-1 text-lg leading-none text-muted-foreground hover:bg-muted"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="divide-y divide-border">
                    {channels.map((channel) => {
                        const Icon = channel.icon
                        const isExpanded =
                            expanded === channel.key

                        return (
                            <div key={channel.key}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpanded(
                                            isExpanded
                                                ? null
                                                : channel.key,
                                        )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                                >
                                    <Icon className="h-4 w-4 shrink-0 text-foreground" />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {channel.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {channel.description}
                                        </p>
                                    </div>

                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="space-y-1 bg-muted/20 px-4 pb-3">
                                        {details.map((item) => (
                                            <label
                                                key={item.key}
                                                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-background"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={prefs[item.key]}
                                                    disabled={
                                                        saving === item.key
                                                    }
                                                    onChange={(event) =>
                                                        updatePreference(
                                                            item.key,
                                                            event.target.checked,
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-primary"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="border-t border-border p-3">
                    <button
                        type="button"
                        onClick={() => setExpanded('inApp')}
                        className="w-full rounded-lg bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/15"
                    >
                        Manage Preferences
                    </button>
                </div>
            </section>
        </>
    )
}