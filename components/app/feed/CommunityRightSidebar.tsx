import Link from 'next/link'
import { TrendingUp, CalendarDays } from 'lucide-react'
import { fetchTrendingHashtags } from '@/lib/actions/posts'

export default async function CommunityRightSidebar()
{
    const trending = await fetchTrendingHashtags(5)

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
            {/* Trending Topics — real, computed from recent post hashtags */}
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
                                href={`/app/search?q=%23${t.tag}`}
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

            {/* Upcoming Community Events — no events table yet, shown inert */}
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
