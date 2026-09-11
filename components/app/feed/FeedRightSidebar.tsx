import Link from 'next/link'
import
    {
        PiggyBank,
        ShoppingBag,
        Rocket,
        HandCoins,
        Briefcase,
        Users2,
        Circle,
        Clock,
        HeartHandshake,
        Star,
        ImageIcon,
    } from 'lucide-react'
import { fetchRecentPostsPreviews } from '@/lib/actions/posts'

const EXPLORE_ITEMS = [
    { icon: PiggyBank, label: 'Save', sub: 'Build your future', href: '/app/fintech/safe', color: 'text-green-600 bg-green-50' },
    { icon: ShoppingBag, label: 'Marketplace', sub: 'Buy. Sell. Support', href: '/app/services', color: 'text-blue-600 bg-blue-50' },
    { icon: Rocket, label: 'Business Launch', sub: 'Start & grow your business', href: '/app/fintech', color: 'text-purple-600 bg-purple-50' },
    { icon: HandCoins, label: 'Crowdfunding', sub: 'Raise. Fund. Impact', href: '/app/funding', color: 'text-rose-600 bg-rose-50' },
    { icon: Briefcase, label: 'Jobs', sub: 'Find opportunities', href: '/app/services', color: 'text-amber-600 bg-amber-50' },
    { icon: Users2, label: 'Connect', sub: 'Grow your network', href: '/app/search', color: 'text-cyan-600 bg-cyan-50' },
]

const ACTIVE_GROUPS = [
    { name: 'Philanthropists Circle', members: '2.4K', online: true, icon: HeartHandshake },
    { name: 'Entrepreneurs Network', members: '5.1K', online: true, icon: Briefcase },
    { name: 'Youth Impact Hub', members: '3.2K', online: true, icon: Star },
]

const ONLINE_USERS = [
    { initials: 'AO', color: 'bg-green-400' },
    { initials: 'BF', color: 'bg-blue-400' },
    { initials: 'CK', color: 'bg-purple-400' },
    { initials: 'DM', color: 'bg-rose-400' },
]

function timeAgo(dateStr: string): string
{
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default async function FeedRightSidebar()
{
    const recentPosts = await fetchRecentPostsPreviews(5)

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0 pt-2">
            {/* Sponsored card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-emerald-700 text-white p-4 shadow-sm dark:shadow-none relative overflow-hidden">
                <p className="text-[10px] font-medium opacity-70 mb-1">Sponsored</p>
                <h3 className="font-bold text-base leading-tight mb-1">Grow Your Business with HubNovo</h3>
                <p className="text-xs opacity-80 mb-3">Access funding, tools and a community that supports your hustle.</p>
                <button className="bg-white text-primary text-xs font-bold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                    Learn More
                </button>
                <Rocket className="absolute right-3 bottom-2 w-10 h-10 opacity-20" />
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Recent Posts
                        </h3>
                        <Link href="/app/feed" className="text-xs text-primary font-medium hover:underline">
                            See all
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentPosts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/app/feed/${post.id}`}
                                className="block p-2 rounded-xl hover:bg-muted transition-colors group"
                            >
                                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                                    {post.caption ? (
                                        post.caption.length > 60
                                            ? `${post.caption.slice(0, 60)}…`
                                            : post.caption
                                    ) : (
                                        <span className="inline-flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" />
                                            Media post
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                                        {post.author_name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                        {timeAgo(post.created_at)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Explore HubNovo */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">Explore HubNovo</h3>
                    <Link href="/app/fintech" className="text-xs text-primary font-medium hover:underline">View All</Link>
                </div>
                <div className="space-y-2">
                    {EXPLORE_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted transition-colors group"
                        >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${item.color} shrink-0`}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {item.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Active Groups */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">Active Groups</h3>
                    <Link href="/app/funding" className="text-xs text-primary font-medium hover:underline">View All</Link>
                </div>
                <div className="space-y-3">
                    {ACTIVE_GROUPS.map((group) => (
                        <div key={group.name} className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-xl p-1.5 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                <group.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{group.name}</p>
                                <p className="text-[10px] text-muted-foreground">{group.members} members</p>
                            </div>
                            {group.online && (
                                <Circle className="w-2.5 h-2.5 text-green-500 fill-green-500 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Online Now */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm dark:shadow-none">
                <h3 className="font-bold text-sm text-foreground mb-3">Online Now</h3>
                <div className="flex items-center gap-1.5">
                    {ONLINE_USERS.map((u, i) => (
                        <div
                            key={i}
                            className={`relative w-9 h-9 rounded-full ${u.color} flex items-center justify-center text-white text-xs font-bold border-2 border-card`}
                        >
                            {u.initials}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                        </div>
                    ))}
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground border-2 border-card">
                        +24
                    </div>
                </div>
            </div>
        </aside>
    )
}
