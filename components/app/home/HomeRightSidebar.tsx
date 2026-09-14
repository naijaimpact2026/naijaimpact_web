import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/server'
import { fetchCourses } from '@/lib/actions/learn'
import { fetchRecentPostsPreviews } from '@/lib/actions/posts'
import HomeMessagesStat from './HomeMessagesStat'
import ImpactCtaIllustration from '@/components/illustrations/ImpactCtaIllustration'
import
{
    Settings,
    Briefcase,
    ShoppingBag,
    Wrench,
    HandCoins,
    CalendarPlus,
    GraduationCap,
    MessageSquare,
} from 'lucide-react'
import type { User } from '@/lib/types'

interface HomeRightSidebarProps
{
    user: User
}

const QUICK_ACTIONS = [
    { icon: Briefcase, label: 'Post a Job', href: null },
    { icon: ShoppingBag, label: 'List a Product', href: '/app/market' },
    { icon: Wrench, label: 'Request an Artisan', href: '/app/services' },
    { icon: HandCoins, label: 'Start a Campaign', href: '/app/funding' },
    { icon: CalendarPlus, label: 'Create an Event', href: null },
]

function timeAgo(dateStr: string): string
{
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default async function HomeRightSidebar({ user }: HomeRightSidebarProps)
{
    const supabase = await createClient()

    const [{ count: ongoingTasks }, { courses: latestCourses }, recentPosts] = await Promise.all([
        supabase
            .from('lms_courses_enrollment')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'enrolled'),
        fetchCourses(null, 3),
        fetchRecentPostsPreviews(1),
    ])

    const updates = [
        ...latestCourses.map((c) => ({
            id: `course-${c.id}`,
            label: `New course: ${c.title}`,
            created_at: c.created_at,
            icon: GraduationCap,
        })),
        ...recentPosts.map((p) => ({
            id: `post-${p.id}`,
            label: `New community post from ${p.author_name}`,
            created_at: p.created_at,
            icon: MessageSquare,
        })),
    ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)

    const initials = user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const firstName = user.display_name.split(' ')[0]
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 pt-2">
            {/* Profile mini-card */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border">
                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name} />
                            <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{greeting},</p>
                            <p className="text-sm font-bold text-foreground truncate">{firstName}</p>
                        </div>
                    </div>
                    <Link
                        href="/app/settings"
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                        aria-label="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>

                {user.quote && (
                    <p className="mt-3 text-xs italic text-muted-foreground leading-relaxed line-clamp-2">
                        &ldquo;{user.quote}&rdquo;
                    </p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                        <p className="text-sm font-bold text-foreground">{user.impact_points}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Impact Points</p>
                    </div>
                    <div className="border-x border-border">
                        <p className="text-sm font-bold text-foreground">{ongoingTasks ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Ongoing Tasks</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            <HomeMessagesStat />
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">New Messages</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-1">
                    {QUICK_ACTIONS.map((action) => (
                        <QuickActionRow key={action.label} {...action} />
                    ))}
                </div>
            </div>

            {/* Impact CTA */}
            <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #00688A 100%)' }}>
                <p className="font-bold text-sm mb-1">Your Impact Matters</p>
                <p className="text-xs text-white/80 mb-3 leading-relaxed">
                    Together we can build stronger communities and create opportunities for millions.
                </p>
                <Link
                    href="/app/funding"
                    className="inline-flex items-center bg-white text-secondary text-xs font-bold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
                >
                    Make an Impact →
                </Link>
                <ImpactCtaIllustration className="absolute right-1 bottom-1 w-20 h-16 opacity-90" />
            </div>

            {/* Latest Updates */}
            {updates.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-foreground">Latest Updates</h3>
                        <Link href="/app/feed" className="text-xs text-primary font-medium hover:underline">See All</Link>
                    </div>
                    <div className="space-y-3">
                        {updates.map((u) => (
                            <div key={u.id} className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <u.icon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-foreground leading-snug line-clamp-2">{u.label}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(u.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    )
}

function QuickActionRow({ icon: Icon, label, href }: { icon: typeof Briefcase; label: string; href: string | null })
{
    const content = (
        <>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-primary shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-foreground flex-1">{label}</span>
            {!href && (
                <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                    Soon
                </span>
            )}
        </>
    )

    if (!href)
    {
        return (
            <div className="flex items-center gap-3 p-1.5 rounded-xl opacity-60 cursor-default">
                {content}
            </div>
        )
    }

    return (
        <Link href={href} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted transition-colors">
            {content}
        </Link>
    )
}
