import {
    Bell,
    CheckCheck,
    BarChart3,
} from 'lucide-react'

interface NotificationSummaryProps {
    total: number
    unread: number
}

export default function NotificationSummary({
    total,
    unread,
}: NotificationSummaryProps) {
    return (
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        Notification Summary
                    </h2>

                    <p className="text-xs text-muted-foreground">
                        Your notification activity
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />

                        <span className="text-xs text-muted-foreground">
                            Total
                        </span>
                    </div>

                    <p className="mt-2 text-xl font-bold text-foreground">
                        {total}
                    </p>
                </div>

                <div className="rounded-lg bg-primary/5 p-3">
                    <div className="flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 text-primary" />

                        <span className="text-xs text-muted-foreground">
                            Unread
                        </span>
                    </div>

                    <p className="mt-2 text-xl font-bold text-primary">
                        {unread}
                    </p>
                </div>
            </div>
        </div>
    )
}