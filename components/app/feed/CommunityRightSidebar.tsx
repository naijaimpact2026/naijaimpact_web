import Link from 'next/link'
import { TrendingUp, CalendarDays, Radio, Video, Plus, ArrowRight } from 'lucide-react'
import { fetchTrendingHashtags } from '@/lib/actions/posts'
import { listLiveNow } from '@/lib/modushive/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function getInitials(name?: string | null): string {
    if (!name) return 'U'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default async function CommunityRightSidebar() {
    const [trending, liveStreams] = await Promise.all([
        fetchTrendingHashtags(5),
        listLiveNow().catch(() => []),
    ])

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto scrollbar-none">
            {/* Live Broadcasts Widget — Community Livestream Entry Point */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-destructive" />
                        <span>Live Broadcasts</span>
                        {liveStreams.length > 0 && (
                            <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        )}
                    </h3>
                    <Link
                        href="/app/modushive"
                        className="text-[11px] font-semibold text-primary hover:underline"
                    >
                        View all
                    </Link>
                </div>

                {liveStreams.length > 0 ? (
                    <div className="space-y-2.5">
                        {liveStreams.slice(0, 2).map((s) => (
                            <Link
                                key={s.id}
                                href={`/app/modushive/live/${s.id}`}
                                className="group flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/60 transition-all"
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-8 w-8 ring-2 ring-destructive">
                                        <AvatarImage src={s.host?.avatar_url ?? undefined} />
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                            {getInitials(s.host?.display_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute -bottom-1 -right-1 px-1 rounded-sm bg-destructive text-white text-[8px] font-extrabold uppercase leading-none py-0.5">
                                        LIVE
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                        {s.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {s.host?.display_name ?? 'Community Member'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                            No one is broadcasting live right now.
                        </p>
                        <Link
                            href="/app/modushive/studio"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-xs font-bold"
                        >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Go Live Now</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Trending Topics — computed from recent post hashtags */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Trending Topics
                </h3>
                {trending.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No trending hashtags yet — be the first to use one.</p>
                ) : (
                    <div className="space-y-2.5">
                        {trending.map((t, i) => (
                            <Link
                                key={t.tag}
                                href={`/app/feed?topic=${encodeURIComponent(t.tag)}`}
                                className="flex items-center gap-2.5 group"
                            >
                                <span className="text-xs font-bold text-muted-foreground/50 w-3 shrink-0">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">#{t.tag}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.count} {t.count === 1 ? 'post' : 'posts'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Community Events */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-3">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Upcoming Events
                </h3>
                <div className="flex flex-col items-center text-center py-6 text-muted-foreground">
                    <p className="text-xs">Community events aren&apos;t live yet.</p>
                </div>
            </div>

            {/* CTA */}
            <div className="relative overflow-hidden rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 55%, #00688A 100%)' }}>
                <p className="font-display font-bold text-sm leading-tight">A Stronger Community, A Brighter You</p>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed">Connect, collaborate, create opportunities together.</p>
                <Link
                    href="/app/search"
                    className="mt-3 inline-flex items-center gap-1.5 bg-white text-secondary text-xs font-bold px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
                >
                    Invite People →
                </Link>
            </div>
        </aside>
    )
}
