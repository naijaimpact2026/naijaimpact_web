'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import
{
    Search, Sparkles, ArrowRight, UserPlus, UserCheck, BadgeCheck, MapPin,
    Heart, MessageCircle, Share2, Bookmark, BookOpen, X as XIcon,
    SlidersHorizontal, TrendingUp, ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { searchUsers, searchPosts, searchCourses } from '@/lib/actions/search'
import { fetchSuggestedUsers } from '@/lib/actions/posts'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import { toPublicStorageUrl } from '@/lib/supabase-image'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from '@/components/app/skeletons/primitives'

type UserResult = {
    id: string; username: string; display_name: string; avatar_url: string | null
    cover_url: string | null; verified: boolean; profession: string | null; location: string | null
    is_following: boolean
}
type PostResult = {
    id: string; caption: string | null; created_at: string; cover_url: string | null
    reaction_count: number; comment_count: number
    author: { username: string; display_name: string; avatar_url: string | null } | null
}
type CourseResult = { id: string; title: string; thumbnail_url: string | null; price: number; instructor: { display_name: string; avatar_url: string | null } | null }
type SuggestedUser = { id: string; username: string; display_name: string; avatar_url: string | null; verified: boolean; profession: string | null }

type Tab = 'all' | 'people' | 'posts' | 'courses'

const SOON_CATEGORIES = ['Businesses', 'Groups', 'Products', 'Jobs', 'Events', 'Hashtags']

function getInitials(name?: string | null)
{
    if (!name) return 'U'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(d: string)
{
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
}

function parseCaption(caption: string)
{
    const parts = caption.split(/(#\w+)/g)
    return parts.map((part, i) =>
        part.startsWith('#')
            ? <span key={i} className="text-primary font-medium">{part}</span>
            : <span key={i}>{part}</span>
    )
}

// ── Skeletons / empty states ────────────────────────────────────────────────

function Skeletons()
{
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                    <Skeleton className="h-24 w-full rounded-none" delay={i * WAVE_STEP} />
                    <div className="p-3 space-y-2">
                        <SkeletonLine width="65%" height={12} delay={i * WAVE_STEP} />
                        <SkeletonLine width="45%" height={10} delay={i * WAVE_STEP} />
                    </div>
                </div>
            ))}
        </div>
    )
}

function IdleState({ onPick }: { onPick: (term: string) => void })
{
    const TRENDING = ['Entrepreneurs', 'Philanthropy', 'StartupNG', 'Education', 'Impact']
    return (
        <div className="flex flex-col items-center gap-5 py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary">
                <Search className="w-8 h-8 text-white" />
            </div>
            <div>
                <p className="font-bold text-foreground text-lg">Discover Hubnovo</p>
                <p className="text-sm text-muted-foreground mt-1">Search for people, posts, and courses</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {TRENDING.map(t => (
                    <button
                        key={t}
                        onClick={() => onPick(t)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                        <Sparkles className="w-3 h-3" /> {t}
                    </button>
                ))}
            </div>
        </div>
    )
}

function NoResults({ query }: { query: string })
{
    return (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-muted-foreground">Try different keywords or check spelling</p>
        </div>
    )
}

// ── Top Results — rich people cards ─────────────────────────────────────────

function TopResultCard({ user }: { user: UserResult })
{
    const [following, setFollowing] = useState(user.is_following)
    const [pending, setPending] = useState(false)

    async function toggleFollow(e: React.MouseEvent)
    {
        e.preventDefault()
        if (pending) return
        setPending(true)
        const next = !following
        setFollowing(next)
        try
        {
            const result = next ? await followUser(user.id) : await unfollowUser(user.id)
            if (!result.success) setFollowing(!next)
        } catch { setFollowing(!next) } finally { setPending(false) }
    }

    return (
        <Link
            href={`/app/profile/${user.username}`}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group"
        >
            <div className="relative h-16 bg-gradient-to-br from-secondary to-primary overflow-hidden">
                {user.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
            </div>
            <div className="px-3 pb-3">
                <Avatar className="h-12 w-12 -mt-6 ring-4 ring-card">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{getInitials(user.display_name)}</AvatarFallback>
                </Avatar>
                <div className="mt-2 flex items-center gap-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{user.display_name}</p>
                    {user.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0 fill-primary/15" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.profession ?? `@${user.username}`}</p>
                {user.location && (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {user.location}
                    </p>
                )}
                <Button
                    size="sm"
                    variant={following ? 'outline' : 'default'}
                    onClick={toggleFollow}
                    disabled={pending}
                    className="w-full mt-2.5 rounded-full gap-1.5"
                >
                    {following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
                </Button>
            </div>
        </Link>
    )
}

// ── Latest Posts — image card grid ──────────────────────────────────────────

function LatestPostCard({ post }: { post: PostResult })
{
    return (
        <Link
            href={`/app/feed/${post.id}`}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                {post.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-muted to-card">
                        <p className="text-xs text-foreground/70 text-center line-clamp-5">{post.caption}</p>
                    </div>
                )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={post.author?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{getInitials(post.author?.display_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-semibold text-foreground truncate">{post.author?.display_name ?? 'Unknown'}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">· {timeAgo(post.created_at)}</span>
                </div>
                {post.caption && post.cover_url && (
                    <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed mb-2">{parseCaption(post.caption)}</p>
                )}
                <div className="mt-auto flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1 text-[11px]"><Heart className="h-3.5 w-3.5" /> {post.reaction_count}</span>
                    <span className="flex items-center gap-1 text-[11px]"><MessageCircle className="h-3.5 w-3.5" /> {post.comment_count}</span>
                    <Share2 className="h-3.5 w-3.5 ml-auto" />
                    <Bookmark className="h-3.5 w-3.5" />
                </div>
            </div>
        </Link>
    )
}

function CourseCard({ course }: { course: CourseResult })
{
    const thumb = toPublicStorageUrl(course.thumbnail_url)
    return (
        <Link href={`/app/learn/${course.id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
                {thumb
                    ? <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-secondary"><BookOpen className="w-6 h-6 text-white/80" /></div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{course.title}</p>
                <p className="text-xs text-muted-foreground truncate">{course.instructor?.display_name ?? 'Instructor'}</p>
                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${course.price === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}
                </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
        </Link>
    )
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, onSeeAll }: { label: string; count: number; onSeeAll?: () => void })
{
    return (
        <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
            <h2 className="font-display text-base font-bold text-foreground">{label} <span className="text-sm font-normal text-muted-foreground">({count})</span></h2>
            {onSeeAll && (
                <button onClick={onSeeAll} className="text-xs font-semibold text-primary hover:underline shrink-0">See all</button>
            )}
        </div>
    )
}

// ── Category pills — real ones are clickable, the rest are visual-only "Soon" ──

function CategoryPills({ tab, setTab, counts }: { tab: Tab; setTab: (t: Tab) => void; counts: Record<Tab, number> })
{
    const REAL: { key: Tab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'people', label: 'People' },
        { key: 'posts', label: 'Posts' },
        { key: 'courses', label: 'Courses' },
    ]

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {REAL.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === key
                        ? 'text-white bg-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground bg-card border border-border'
                        }`}
                >
                    {label}
                    {counts[key] > 0 && key !== 'all' && (
                        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-bold">{counts[key]}</span>
                    )}
                </button>
            ))}
            {SOON_CATEGORIES.map((label) => (
                <span
                    key={label}
                    title="Coming soon"
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground/50 cursor-default select-none"
                >
                    {label}
                </span>
            ))}
        </div>
    )
}

// ── Right rail: Filters (visual only), Trending Searches (static), Suggested ──

function FiltersPanel()
{
    const FILTERS = [
        { label: 'Content Type', value: 'All' },
        { label: 'Location', value: 'All locations' },
        { label: 'Date Posted', value: 'Any time' },
        { label: 'Industry', value: 'All industries' },
    ]
    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Filters
                </h3>
                <span className="text-xs text-muted-foreground/60 cursor-default">Reset</span>
            </div>
            <div className="space-y-1">
                {FILTERS.map((f) => (
                    <div key={f.label} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-muted-foreground/70 cursor-not-allowed" title="Coming soon">
                        <span className="text-xs font-medium text-foreground/70">{f.label}</span>
                        <span className="flex items-center gap-1 text-xs">{f.value} <ChevronRight className="h-3.5 w-3.5" /></span>
                    </div>
                ))}
                <div className="flex items-center justify-between pt-2 text-muted-foreground/70 cursor-not-allowed" title="Coming soon">
                    <span className="text-xs font-medium text-foreground/70">Verified Only</span>
                    <span className="w-8 h-[18px] rounded-full bg-muted relative">
                        <span className="absolute left-0.5 top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                    </span>
                </div>
            </div>
        </div>
    )
}

function TrendingSearches({ onPick }: { onPick: (term: string) => void })
{
    const TRENDING = ['solar installation', 'remote jobs', 'small business ideas', 'Hubnovo training', 'skincare products']
    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending Searches
            </h3>
            <div className="space-y-2.5">
                {TRENDING.map((term, i) => (
                    <button key={term} onClick={() => onPick(term)} className="flex items-center gap-2.5 w-full text-left group">
                        <span className="text-xs font-bold text-muted-foreground/50 w-3 shrink-0">{i + 1}</span>
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate">{term}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

function SuggestedForYou()
{
    const [users, setUsers] = useState<SuggestedUser[] | null>(null)

    useEffect(() => { fetchSuggestedUsers(4).then(setUsers).catch(() => setUsers([])) }, [])
    if (users !== null && users.length === 0) return null

    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-3">Suggested for You</h3>
            {users === null ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 animate-pulse">
                            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-2.5 bg-muted rounded-full w-2/3" />
                                <div className="h-2 bg-muted rounded-full w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((u) => (
                        <div key={u.id} className="flex items-center gap-2.5">
                            <Link href={`/app/profile/${u.username}`} className="shrink-0">
                                <Avatar className="h-9 w-9 ring-1 ring-border">
                                    <AvatarImage src={u.avatar_url ?? undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(u.display_name)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link href={`/app/profile/${u.username}`} className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block">
                                    {u.display_name}
                                </Link>
                                <p className="text-[11px] text-muted-foreground truncate">{u.profession ?? `@${u.username}`}</p>
                            </div>
                            <Button size="icon-sm" variant="outline" aria-label={`Follow ${u.username}`} className="shrink-0">
                                <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SearchPageInner()
{
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') ?? ''

    const [query, setQuery] = useState(initialQuery)
    const [debounced, setDebounced] = useState(initialQuery)
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<Tab>('all')
    const [users, setUsers] = useState<UserResult[]>([])
    const [posts, setPosts] = useState<PostResult[]>([])
    const [courses, setCourses] = useState<CourseResult[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() =>
    {
        const t = setTimeout(() => setDebounced(query), 300)
        return () => clearTimeout(t)
    }, [query])

    useEffect(() =>
    {
        if (debounced.length < 2) { setUsers([]); setPosts([]); setCourses([]); return }
        setLoading(true)
        Promise.all([searchUsers(debounced), searchPosts(debounced), searchCourses(debounced)])
            .then(([u, p, c]) => { setUsers(u as UserResult[]); setPosts(p as PostResult[]); setCourses(c as CourseResult[]) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [debounced])

    const hasSearched = debounced.length >= 2
    const totalResults = users.length + posts.length + courses.length
    const counts: Record<Tab, number> = { all: totalResults, people: users.length, posts: posts.length, courses: courses.length }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-5">

                    <div>
                        <h1 className="font-display text-2xl font-extrabold text-secondary">Search</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Find people, ideas, opportunities and more on Hubnovo.</p>
                    </div>

                    {/* Search input (mobile — desktop uses the top bar) */}
                    <div className="relative lg:hidden" onClick={() => inputRef.current?.focus()}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="search"
                            placeholder="Search Hubnovo…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-11 pr-9 py-3 rounded-xl text-sm font-medium bg-card border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                            autoComplete="off"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <CategoryPills tab={tab} setTab={setTab} counts={counts} />

                    {loading ? (
                        <Skeletons />
                    ) : !hasSearched ? (
                        <IdleState onPick={setQuery} />
                    ) : totalResults === 0 ? (
                        <NoResults query={debounced} />
                    ) : (
                        <div>
                            {(tab === 'all' || tab === 'people') && users.length > 0 && (
                                <div>
                                    <SectionHeader label={tab === 'all' ? 'Top Results' : 'People'} count={users.length} onSeeAll={tab === 'all' && users.length > 4 ? () => setTab('people') : undefined} />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {users.slice(0, tab === 'all' ? 4 : 20).map(u => <TopResultCard key={u.id} user={u} />)}
                                    </div>
                                </div>
                            )}

                            {(tab === 'all' || tab === 'posts') && posts.length > 0 && (
                                <div>
                                    <SectionHeader label="Latest Posts" count={posts.length} onSeeAll={tab === 'all' && posts.length > 4 ? () => setTab('posts') : undefined} />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {posts.slice(0, tab === 'all' ? 4 : 20).map(p => <LatestPostCard key={p.id} post={p} />)}
                                    </div>
                                </div>
                            )}

                            {(tab === 'all' || tab === 'courses') && courses.length > 0 && (
                                <div>
                                    <SectionHeader label="Courses" count={courses.length} onSeeAll={tab === 'all' && courses.length > 3 ? () => setTab('courses') : undefined} />
                                    <div className="space-y-2">
                                        {courses.slice(0, tab === 'all' ? 3 : 20).map(c => <CourseCard key={c.id} course={c} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right rail */}
                <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 pt-1">
                    <FiltersPanel />
                    <TrendingSearches onPick={setQuery} />
                    <SuggestedForYou />
                </aside>
            </div>
        </div>
    )
}

export default function SearchPage()
{
    return (
        <Suspense fallback={null}>
            <SearchPageInner />
        </Suspense>
    )
}
