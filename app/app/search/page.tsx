'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Search, Sparkles, ArrowRight, UserPlus, UserCheck, BadgeCheck, MapPin,
    Heart, MessageCircle, BookOpen, X as XIcon,
    SlidersHorizontal, TrendingUp, ChevronRight, Briefcase,
    RotateCcw, History, Filter
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { searchAll } from '@/lib/actions/search'
import { fetchSuggestedUsers } from '@/lib/actions/posts'
import { followUser, unfollowUser } from '@/lib/actions/profile'
import { toPublicStorageUrl } from '@/lib/supabase-image'
import { stripPostMeta } from '@/lib/post-helpers'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonLine, WAVE_STEP } from '@/components/app/skeletons/primitives'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────────

type UserResult = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    cover_url: string | null
    verified: boolean
    profession: string | null
    location: string | null
    is_following: boolean
}

type PostResult = {
    id: string
    caption: string | null
    created_at: string
    cover_url: string | null
    media_count?: number
    has_video?: boolean
    reaction_count: number
    comment_count: number
    author: {
        id?: string
        username: string
        display_name: string
        avatar_url: string | null
        verified?: boolean
        profession?: string | null
    } | null
}

type CourseResult = {
    id: string
    title: string
    thumbnail_url: string | null
    price: number
    instructor: {
        display_name: string
        avatar_url: string | null
    } | null
}

type JobResult = {
    id: string
    title: string
    company_name: string
    category: string
    job_type: string
    workplace_type: string
    location_city: string | null
    location_state: string | null
    salary_min: number | null
    salary_max: number | null
    currency: string
    created_at: string
    employer: {
        id?: string
        display_name: string
        avatar_url: string | null
        username: string
        verified?: boolean
    } | null
}

type SuggestedUser = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    verified: boolean
    profession: string | null
}

type Tab = 'all' | 'people' | 'posts' | 'courses' | 'jobs'

type SearchFilters = {
    contentType: Tab
    verifiedOnly: boolean
    datePosted: 'all' | '24h' | '7d' | '30d'
    location: string
    industry: string
}

const DEFAULT_FILTERS: SearchFilters = {
    contentType: 'all',
    verifiedOnly: false,
    datePosted: 'all',
    location: 'all',
    industry: 'all',
}

const SOON_CATEGORIES = ['Businesses', 'Groups', 'Products', 'Events', 'Hashtags']
const RECENT_KEY = 'hubnovo_recent_searches'

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
    if (!name) return 'U'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
}

function parseCaption(caption: string) {
    const cleaned = stripPostMeta(caption)
    const parts = cleaned.split(/(#\w+|@\w+)/g)
    return parts.map((part, i) => {
        if (part.startsWith('#')) {
            return (
                <Link
                    key={i}
                    href={`/app/feed?topic=${encodeURIComponent(part.slice(1))}`}
                    className="text-primary font-semibold hover:underline"
                >
                    {part}
                </Link>
            )
        }
        if (part.startsWith('@')) {
            return (
                <Link
                    key={i}
                    href={`/app/profile/${part.slice(1)}`}
                    className="text-primary font-medium hover:underline"
                >
                    {part}
                </Link>
            )
        }
        return <span key={i}>{part}</span>
    })
}

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const item = localStorage.getItem(RECENT_KEY)
        return item ? JSON.parse(item) : []
    } catch {
        return []
    }
}

function saveRecentSearch(term: string) {
    if (typeof window === 'undefined') return
    const clean = term.trim()
    if (!clean || clean.length < 2) return
    try {
        const list = getRecentSearches().filter(s => s.toLowerCase() !== clean.toLowerCase())
        list.unshift(clean)
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)))
    } catch {}
}

function matchesIndustry(text: string | null | undefined, industry: string): boolean {
    if (!text || industry === 'all') return true
    const t = text.toLowerCase()
    switch (industry) {
        case 'Technology':
            return t.includes('tech') || t.includes('software') || t.includes('developer') || t.includes('data') || t.includes('code') || t.includes('engineer') || t.includes('web')
        case 'Business':
            return t.includes('business') || t.includes('finance') || t.includes('account') || t.includes('market') || t.includes('manage') || t.includes('sales')
        case 'Creative':
            return t.includes('design') || t.includes('creative') || t.includes('media') || t.includes('art') || t.includes('video') || t.includes('content') || t.includes('photo')
        case 'Education':
            return t.includes('educat') || t.includes('teach') || t.includes('train') || t.includes('school') || t.includes('learn')
        case 'Healthcare':
            return t.includes('health') || t.includes('med') || t.includes('care') || t.includes('nurse') || t.includes('doctor')
        case 'Agriculture':
            return t.includes('agric') || t.includes('farm')
        default:
            return t.includes(industry.toLowerCase())
    }
}

// ── Skeletons / empty states ────────────────────────────────────────────────

function Skeletons() {
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

function IdleState({
    onPick,
    recentSearches,
    onClearRecent,
}: {
    onPick: (term: string) => void
    recentSearches: string[]
    onClearRecent: () => void
}) {
    const TRENDING = ['Entrepreneurs', 'Tech in Nigeria', 'Philanthropy', 'StartupNG', 'Agriculture', 'Remote Jobs']
    return (
        <div className="flex flex-col items-center gap-6 py-14 text-center px-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 text-primary shadow-xs">
                <Search className="w-8 h-8" />
            </div>
            <div>
                <h2 className="font-display font-extrabold text-foreground text-xl">Discover on Hubnovo</h2>
                <p className="text-sm text-muted-foreground mt-1">Search for people, posts, jobs, and learning courses across the network.</p>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
                <div className="w-full space-y-2 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5" /> Recent Searches
                        </span>
                        <button
                            onClick={onClearRecent}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map(term => (
                            <button
                                key={term}
                                onClick={() => onPick(term)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all active:scale-[0.98]"
                            >
                                <History className="w-3 h-3 text-muted-foreground" />
                                <span>{term}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending Searches */}
            <div className="w-full space-y-2 text-left">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Popular Topics
                </span>
                <div className="flex flex-wrap gap-2">
                    {TRENDING.map(t => (
                        <button
                            key={t}
                            onClick={() => onPick(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all active:scale-[0.98]"
                        >
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span>{t}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function NoResults({
    query,
    hasFilters,
    onResetFilters,
}: {
    query: string
    hasFilters: boolean
    onResetFilters: () => void
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-16 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Search className="w-7 h-7" />
            </div>
            <p className="font-bold text-foreground text-base">No results for &ldquo;{query}&rdquo;</p>
            {hasFilters ? (
                <>
                    <p className="text-xs text-muted-foreground">Some results may have been hidden by active filter settings.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-2 rounded-full text-xs gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset all filters
                    </Button>
                </>
            ) : (
                <p className="text-xs text-muted-foreground">Try checking for typos or searching for broader terms like names, topics, or skills.</p>
            )}
        </div>
    )
}

// ── Top Results — rich people cards ─────────────────────────────────────────

function TopResultCard({ user }: { user: UserResult }) {
    const [following, setFollowing] = useState(user.is_following)
    const [pending, setPending] = useState(false)

    async function toggleFollow(e: React.MouseEvent) {
        e.preventDefault()
        if (pending) return
        setPending(true)
        const next = !following
        setFollowing(next)
        try {
            const result = next ? await followUser(user.id) : await unfollowUser(user.id)
            if (result.success) {
                if (next) {
                    toast.success(`You are now following ${user.display_name}`)
                } else {
                    toast.info(`Unfollowed ${user.display_name}`)
                }
            } else {
                setFollowing(!next)
                toast.error(result.error || 'Failed to update follow status')
            }
        } catch {
            setFollowing(!next)
            toast.error('Something went wrong')
        } finally {
            setPending(false)
        }
    }

    return (
        <Link
            href={`/app/profile/${user.username}`}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group flex flex-col justify-between"
        >
            <div>
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
                </div>
            </div>
            <div className="px-3 pb-3">
                <Button
                    size="sm"
                    variant={following ? 'outline' : 'default'}
                    onClick={toggleFollow}
                    disabled={pending}
                    className="w-full rounded-full gap-1.5 text-xs font-semibold"
                >
                    {following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
                </Button>
            </div>
        </Link>
    )
}

// ── Latest Posts — rich social post card ────────────────────────────────────

function LatestPostCard({ post }: { post: PostResult }) {
    const cleanCaption = stripPostMeta(post.caption)
    const authorName = post.author?.display_name || 'Community Member'
    const authorUsername = post.author?.username || ''
    const isVerified = post.author?.verified ?? false

    return (
        <article className="group rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            <div className="p-4 pb-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Link href={`/app/profile/${authorUsername}`} className="shrink-0">
                            <Avatar className="h-9 w-9 ring-1 ring-border group-hover:ring-primary/40 transition-all">
                                <AvatarImage src={post.author?.avatar_url ?? undefined} alt={authorName} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {getInitials(authorName)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <Link
                                    href={`/app/profile/${authorUsername}`}
                                    className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate"
                                >
                                    {authorName}
                                </Link>
                                {isVerified && (
                                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0 fill-primary/15" />
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                {authorUsername && <span className="truncate">@{authorUsername}</span>}
                                <span>·</span>
                                <span className="shrink-0">{timeAgo(post.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/app/feed/${post.id}`}
                        className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline shrink-0"
                    >
                        View post →
                    </Link>
                </div>

                {cleanCaption && (
                    <div className="mt-3 text-xs sm:text-sm text-foreground/90 leading-relaxed break-words line-clamp-4">
                        {parseCaption(cleanCaption)}
                    </div>
                )}
            </div>

            {post.cover_url && (
                <Link href={`/app/feed/${post.id}`} className="block px-4 pb-2">
                    <div className="relative rounded-xl overflow-hidden bg-muted aspect-video max-h-56 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={post.cover_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        {(post.media_count ?? 1) > 1 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                                +{(post.media_count ?? 1) - 1} more
                            </span>
                        )}
                    </div>
                </Link>
            )}

            <div className="px-4 py-2.5 mt-auto border-t border-border/60 bg-muted/20 flex items-center justify-between text-muted-foreground text-xs">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/app/feed/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                        <Heart className="h-3.5 w-3.5" />
                        <span className="font-semibold text-[11px]">{post.reaction_count}</span>
                    </Link>
                    <Link
                        href={`/app/feed/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="font-semibold text-[11px]">{post.comment_count}</span>
                    </Link>
                </div>

                <Link
                    href={`/app/feed/${post.id}`}
                    className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    Read discussion
                </Link>
            </div>
        </article>
    )
}

// ── Course Card ─────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: CourseResult }) {
    const thumb = toPublicStorageUrl(course.thumbnail_url)
    return (
        <Link
            href={`/app/learn/${course.id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all group"
        >
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
                {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <BookOpen className="w-6 h-6 text-white/80" />
                    </div>
                )}
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

// ── Job Result Card ─────────────────────────────────────────────────────────

function JobResultCard({ job }: { job: JobResult }) {
    const employerName = job.employer?.display_name || job.company_name || 'Hiring Company'
    const isVerified = job.employer?.verified ?? false

    return (
        <Link
            href={`/app/jobs/${job.id}`}
            className="group rounded-2xl bg-card border border-border p-4 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
        >
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-10 w-10 ring-1 ring-border shrink-0">
                            <AvatarImage src={job.employer?.avatar_url ?? undefined} alt={employerName} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {getInitials(employerName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                <span>{job.company_name || employerName}</span>
                                {isVerified && <BadgeCheck className="h-3 w-3 text-primary shrink-0 fill-primary/15" />}
                            </div>
                        </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(job.created_at)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {job.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground/80">
                            <Briefcase className="w-3 h-3 mr-1 text-muted-foreground" />
                            {job.category}
                        </span>
                    )}
                    {job.job_type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary capitalize">
                            {job.job_type.replace('_', ' ')}
                        </span>
                    )}
                    {job.workplace_type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/10 text-secondary capitalize">
                            {job.workplace_type}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                        {[job.location_city, job.location_state].filter(Boolean).join(', ') || (job.workplace_type === 'remote' ? 'Remote' : 'Nigeria')}
                    </span>
                </div>
                {job.salary_max ? (
                    <span className="font-bold text-foreground shrink-0">
                        {job.currency === 'NGN' ? '₦' : job.currency}
                        {(job.salary_min ? `${job.salary_min.toLocaleString()} - ` : '')}
                        {job.salary_max.toLocaleString()}/mo
                    </span>
                ) : (
                    <span className="text-muted-foreground text-[11px] shrink-0">Competitive</span>
                )}
            </div>
        </Link>
    )
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, onSeeAll }: { label: string; count: number; onSeeAll?: () => void }) {
    return (
        <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
            <h2 className="font-display text-base font-bold text-foreground">
                {label} <span className="text-sm font-normal text-muted-foreground">({count})</span>
            </h2>
            {onSeeAll && (
                <button onClick={onSeeAll} className="text-xs font-semibold text-primary hover:underline shrink-0">
                    See all
                </button>
            )}
        </div>
    )
}

// ── Category pills ───────────────────────────────────────────────────────────

function CategoryPills({
    tab,
    setTab,
    counts,
}: {
    tab: Tab
    setTab: (t: Tab) => void
    counts: Record<Tab, number>
}) {
    const REAL: { key: Tab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'people', label: 'People' },
        { key: 'posts', label: 'Posts' },
        { key: 'jobs', label: 'Jobs' },
        { key: 'courses', label: 'Courses' },
    ]

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {REAL.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        tab === key
                            ? 'text-white bg-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground bg-card border border-border'
                    }`}
                >
                    {label}
                    {counts[key] > 0 && key !== 'all' && (
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-bold">
                            {counts[key]}
                        </span>
                    )}
                </button>
            ))}
            {SOON_CATEGORIES.map((label) => (
                <span
                    key={label}
                    title="Coming soon"
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground/40 cursor-default select-none"
                >
                    {label}
                </span>
            ))}
        </div>
    )
}

// ── Interactive Filters Panel ───────────────────────────────────────────────

function FiltersPanel({
    filters,
    setFilters,
    onReset,
    activeCount,
}: {
    filters: SearchFilters
    setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
    onReset: () => void
    activeCount: number
}) {
    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Filters</h3>
                    {activeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 ? (
                    <button
                        onClick={onReset}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                    </button>
                ) : (
                    <span className="text-xs text-muted-foreground/40 select-none">Reset</span>
                )}
            </div>

            <div className="space-y-3.5">
                {/* Content Type */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                        <span>Content Type</span>
                        {filters.contentType !== 'all' && (
                            <span className="text-[10px] text-primary capitalize font-medium">{filters.contentType}</span>
                        )}
                    </label>
                    <Select
                        value={filters.contentType}
                        onValueChange={(val) => setFilters(f => ({ ...f, contentType: val as Tab }))}
                    >
                        <SelectTrigger className="w-full text-xs h-9 rounded-xl bg-muted/40 border-border">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="people">People only</SelectItem>
                            <SelectItem value="posts">Posts only</SelectItem>
                            <SelectItem value="jobs">Jobs only</SelectItem>
                            <SelectItem value="courses">Courses only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                        <span>Location</span>
                        {filters.location !== 'all' && (
                            <span className="text-[10px] text-primary font-medium">{filters.location}</span>
                        )}
                    </label>
                    <Select
                        value={filters.location}
                        onValueChange={(val) => setFilters(f => ({ ...f, location: val }))}
                    >
                        <SelectTrigger className="w-full text-xs h-9 rounded-xl bg-muted/40 border-border">
                            <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
                            <SelectItem value="Lagos">Lagos, Nigeria</SelectItem>
                            <SelectItem value="Abuja">Abuja (FCT)</SelectItem>
                            <SelectItem value="Port Harcourt">Port Harcourt, Rivers</SelectItem>
                            <SelectItem value="Ibadan">Ibadan, Oyo</SelectItem>
                            <SelectItem value="Kano">Kano</SelectItem>
                            <SelectItem value="Enugu">Enugu</SelectItem>
                            <SelectItem value="Remote">Remote only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Posted */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                        <span>Date Posted</span>
                        {filters.datePosted !== 'all' && (
                            <span className="text-[10px] text-primary font-medium">Active</span>
                        )}
                    </label>
                    <Select
                        value={filters.datePosted}
                        onValueChange={(val) => setFilters(f => ({ ...f, datePosted: val as any }))}
                    >
                        <SelectTrigger className="w-full text-xs h-9 rounded-xl bg-muted/40 border-border">
                            <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="24h">Past 24 hours</SelectItem>
                            <SelectItem value="7d">Past 7 days</SelectItem>
                            <SelectItem value="30d">Past 30 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Industry / Sector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                        <span>Industry / Sector</span>
                        {filters.industry !== 'all' && (
                            <span className="text-[10px] text-primary font-medium">{filters.industry}</span>
                        )}
                    </label>
                    <Select
                        value={filters.industry}
                        onValueChange={(val) => setFilters(f => ({ ...f, industry: val }))}
                    >
                        <SelectTrigger className="w-full text-xs h-9 rounded-xl bg-muted/40 border-border">
                            <SelectValue placeholder="All industries" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All industries</SelectItem>
                            <SelectItem value="Technology">Technology & Software</SelectItem>
                            <SelectItem value="Business">Business & Finance</SelectItem>
                            <SelectItem value="Creative">Creative, Media & Design</SelectItem>
                            <SelectItem value="Education">Education & Training</SelectItem>
                            <SelectItem value="Healthcare">Healthcare & Wellness</SelectItem>
                            <SelectItem value="Agriculture">Agriculture & Agribusiness</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Verified Only Switch */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/15" />
                            Verified Only
                        </span>
                        <p className="text-[10px] text-muted-foreground">Show verified members & listings</p>
                    </div>
                    <Switch
                        checked={filters.verifiedOnly}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, verifiedOnly: checked }))}
                        aria-label="Filter verified only"
                    />
                </div>
            </div>
        </div>
    )
}

// ── Trending Searches ───────────────────────────────────────────────────────

function TrendingSearches({ onPick }: { onPick: (term: string) => void }) {
    const TRENDING = ['Solar installation', 'Remote developer jobs', 'Small business grants', 'Hubnovo training', 'Agribusiness Nigeria']
    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending Searches
            </h3>
            <div className="space-y-2.5">
                {TRENDING.map((term, i) => (
                    <button
                        key={term}
                        onClick={() => onPick(term)}
                        className="flex items-center gap-2.5 w-full text-left group transition-all"
                    >
                        <span className="text-xs font-bold text-muted-foreground/50 w-3 shrink-0">{i + 1}</span>
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate">{term}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ── Suggested For You with working follow buttons ───────────────────────────

function SuggestedUserRow({ user }: { user: SuggestedUser }) {
    const [following, setFollowing] = useState(false)
    const [pending, setPending] = useState(false)

    async function handleToggleFollow(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (pending) return

        const next = !following
        setFollowing(next)
        setPending(true)

        try {
            const res = next ? await followUser(user.id) : await unfollowUser(user.id)
            if (res.success) {
                if (next) {
                    toast.success(`You are now following ${user.display_name}`)
                } else {
                    toast.info(`Unfollowed ${user.display_name}`)
                }
            } else {
                setFollowing(!next)
                toast.error(res.error || 'Failed to update follow status')
            }
        } catch (err: any) {
            setFollowing(!next)
            toast.error(err?.message || 'Something went wrong')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2.5 group">
            <Link href={`/app/profile/${user.username}`} className="shrink-0">
                <Avatar className="h-9 w-9 ring-1 ring-border group-hover:ring-primary/40 transition-all">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(user.display_name)}
                    </AvatarFallback>
                </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
                <Link
                    href={`/app/profile/${user.username}`}
                    className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate flex items-center gap-1"
                >
                    <span className="truncate">{user.display_name}</span>
                    {user.verified && <BadgeCheck className="h-3 w-3 text-primary shrink-0 fill-primary/15" />}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate">{user.profession ?? `@${user.username}`}</p>
            </div>
            <Button
                size="sm"
                variant={following ? 'outline' : 'default'}
                onClick={handleToggleFollow}
                disabled={pending}
                className={`h-7 px-2.5 text-xs rounded-full shrink-0 gap-1 transition-all ${
                    following ? 'border-primary/40 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : ''
                }`}
                aria-label={following ? `Following ${user.username}` : `Follow ${user.username}`}
            >
                {following ? (
                    <>
                        <UserCheck className="h-3 w-3" />
                        <span className="text-[11px] font-semibold">Following</span>
                    </>
                ) : (
                    <>
                        <UserPlus className="h-3 w-3" />
                        <span className="text-[11px] font-semibold">Follow</span>
                    </>
                )}
            </Button>
        </div>
    )
}

function SuggestedForYou() {
    const [users, setUsers] = useState<SuggestedUser[] | null>(null)

    useEffect(() => {
        fetchSuggestedUsers(5)
            .then(setUsers)
            .catch(() => setUsers([]))
    }, [])

    if (users !== null && users.length === 0) return null

    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
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
                        <SuggestedUserRow key={u.id} user={u} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Main Page Inner ─────────────────────────────────────────────────────────

function SearchPageInner() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const urlQuery = searchParams.get('q') ?? ''

    const [query, setQuery] = useState(urlQuery)
    const [debounced, setDebounced] = useState(urlQuery)
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<Tab>('all')
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])

    const [users, setUsers] = useState<UserResult[]>([])
    const [posts, setPosts] = useState<PostResult[]>([])
    const [courses, setCourses] = useState<CourseResult[]>([])
    const [jobs, setJobs] = useState<JobResult[]>([])

    const inputRef = useRef<HTMLInputElement>(null)
    const lastFetchedRef = useRef<string>('')

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(getRecentSearches())
    }, [])

    // Sync state with URL parameter if user navigates back/forward
    useEffect(() => {
        if (urlQuery !== query) {
            setQuery(urlQuery)
            setDebounced(urlQuery)
        }
    }, [urlQuery])

    // Debounce query input
    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(query)
        }, 250)
        return () => clearTimeout(t)
    }, [query])

    // Sync tab changes with filter contentType and vice versa
    const handleTabChange = (newTab: Tab) => {
        setTab(newTab)
        setFilters(f => ({ ...f, contentType: newTab }))
    }

    // When filter contentType changes, update active tab
    useEffect(() => {
        if (filters.contentType !== tab) {
            setTab(filters.contentType)
        }
    }, [filters.contentType])

    // Fetch search results
    useEffect(() => {
        const term = debounced.trim()
        if (term.length < 2) {
            setUsers([])
            setPosts([])
            setCourses([])
            setJobs([])
            setLoading(false)
            lastFetchedRef.current = ''
            return
        }

        if (lastFetchedRef.current === term) {
            return
        }

        let ignore = false
        setLoading(true)
        lastFetchedRef.current = term

        saveRecentSearch(term)
        setRecentSearches(getRecentSearches())

        searchAll(term)
            .then((res) => {
                if (ignore) return
                setUsers((res.users as UserResult[]) ?? [])
                setPosts((res.posts as PostResult[]) ?? [])
                setCourses((res.courses as CourseResult[]) ?? [])
                setJobs((res.jobs as JobResult[]) ?? [])
            })
            .catch((err) => {
                console.error('Search failed:', err)
                toast.error('Search request failed. Please check your network.')
            })
            .finally(() => {
                if (!ignore) setLoading(false)
            })

        return () => {
            ignore = true
        }
    }, [debounced])

    // Explicit submission handler
    const handleExplicitSearch = (searchTerm: string) => {
        const clean = searchTerm.trim()
        if (!clean) return
        setQuery(clean)
        setDebounced(clean)
        saveRecentSearch(clean)
        setRecentSearches(getRecentSearches())
        router.replace(`/app/search?q=${encodeURIComponent(clean)}`, { scroll: false })
    }

    // Reset all filters to default
    const handleResetFilters = () => {
        setFilters(DEFAULT_FILTERS)
        setTab('all')
        toast.info('Filters have been reset')
    }

    // Filter computation
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (filters.verifiedOnly && !u.verified) return false
            if (filters.location !== 'all') {
                if (filters.location === 'Remote') {
                    if (!u.location?.toLowerCase().includes('remote')) return false
                } else {
                    if (!u.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
                }
            }
            if (filters.industry !== 'all') {
                if (!matchesIndustry(u.profession, filters.industry)) return false
            }
            return true
        })
    }, [users, filters.verifiedOnly, filters.location, filters.industry])

    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            if (filters.verifiedOnly && !p.author?.verified) return false
            if (filters.datePosted !== 'all') {
                const now = Date.now()
                const postTime = new Date(p.created_at).getTime()
                const maxAge = filters.datePosted === '24h' ? 86400000 : filters.datePosted === '7d' ? 7 * 86400000 : 30 * 86400000
                if (now - postTime > maxAge) return false
            }
            if (filters.industry !== 'all') {
                if (!matchesIndustry(p.caption, filters.industry) && !matchesIndustry(p.author?.profession, filters.industry)) {
                    return false
                }
            }
            return true
        })
    }, [posts, filters.verifiedOnly, filters.datePosted, filters.industry])

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            if (filters.industry !== 'all') {
                if (!matchesIndustry(c.title, filters.industry)) return false
            }
            return true
        })
    }, [courses, filters.industry])

    const filteredJobs = useMemo(() => {
        return jobs.filter(j => {
            if (filters.verifiedOnly && !j.employer?.verified) return false
            if (filters.datePosted !== 'all') {
                const now = Date.now()
                const jobTime = new Date(j.created_at).getTime()
                const maxAge = filters.datePosted === '24h' ? 86400000 : filters.datePosted === '7d' ? 7 * 86400000 : 30 * 86400000
                if (now - jobTime > maxAge) return false
            }
            if (filters.location !== 'all') {
                if (filters.location === 'Remote') {
                    if (j.workplace_type?.toLowerCase() !== 'remote') return false
                } else {
                    const locLow = filters.location.toLowerCase()
                    const inCity = j.location_city?.toLowerCase().includes(locLow)
                    const inState = j.location_state?.toLowerCase().includes(locLow)
                    if (!inCity && !inState) return false
                }
            }
            if (filters.industry !== 'all') {
                if (!matchesIndustry(j.category, filters.industry) && !matchesIndustry(j.title, filters.industry)) {
                    return false
                }
            }
            return true
        })
    }, [jobs, filters.verifiedOnly, filters.datePosted, filters.location, filters.industry])

    const hasSearched = debounced.trim().length >= 2
    const totalRawResults = users.length + posts.length + courses.length + jobs.length
    const totalFilteredResults = filteredUsers.length + filteredPosts.length + filteredCourses.length + filteredJobs.length

    const counts: Record<Tab, number> = {
        all: totalFilteredResults,
        people: filteredUsers.length,
        posts: filteredPosts.length,
        jobs: filteredJobs.length,
        courses: filteredCourses.length,
    }

    const activeFilterCount = (filters.contentType !== 'all' ? 1 : 0) +
        (filters.verifiedOnly ? 1 : 0) +
        (filters.datePosted !== 'all' ? 1 : 0) +
        (filters.location !== 'all' ? 1 : 0) +
        (filters.industry !== 'all' ? 1 : 0)

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-5">

                    {/* Page Title & Subtitle */}
                    <div>
                        <h1 className="font-display text-2xl font-extrabold text-secondary">Search Hubnovo</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Discover verified members, job opportunities, discussion posts, and courses.
                        </p>
                    </div>

                    {/* Prominent in-page Search Input Bar with embedded Search Button */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleExplicitSearch(query)
                        }}
                        className="relative flex items-center gap-2"
                    >
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            <input
                                ref={inputRef}
                                type="search"
                                placeholder="Search people, posts, jobs, courses…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm font-medium bg-card border border-border shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                autoComplete="off"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery('')
                                        inputRef.current?.focus()
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    aria-label="Clear search"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="h-11 px-5 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shrink-0 shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden sm:inline">Search</span>
                        </Button>
                    </form>

                    {/* Category Pills & Mobile Filter Button */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <CategoryPills tab={tab} setTab={handleTabChange} counts={counts} />
                        </div>
                        <div className="xl:hidden shrink-0">
                            <Button
                                variant={activeFilterCount > 0 ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowMobileFilters(v => !v)}
                                className="rounded-full text-xs gap-1.5 h-9 px-3"
                                aria-label="Toggle filters"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Filters Dropdown Panel */}
                    {showMobileFilters && (
                        <div className="xl:hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <FiltersPanel
                                filters={filters}
                                setFilters={setFilters}
                                onReset={handleResetFilters}
                                activeCount={activeFilterCount}
                            />
                        </div>
                    )}

                    {/* Main Content Area */}
                    {loading ? (
                        <Skeletons />
                    ) : !hasSearched ? (
                        <IdleState
                            onPick={handleExplicitSearch}
                            recentSearches={recentSearches}
                            onClearRecent={() => {
                                localStorage.removeItem(RECENT_KEY)
                                setRecentSearches([])
                            }}
                        />
                    ) : totalFilteredResults === 0 ? (
                        <NoResults
                            query={debounced}
                            hasFilters={activeFilterCount > 0 && totalRawResults > 0}
                            onResetFilters={handleResetFilters}
                        />
                    ) : (
                        <div className="space-y-6">
                            {/* People */}
                            {(tab === 'all' || tab === 'people') && filteredUsers.length > 0 && (
                                <div>
                                    <SectionHeader
                                        label={tab === 'all' ? 'Top Members' : 'People'}
                                        count={filteredUsers.length}
                                        onSeeAll={tab === 'all' && filteredUsers.length > 4 ? () => handleTabChange('people') : undefined}
                                    />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredUsers.slice(0, tab === 'all' ? 4 : 20).map(u => (
                                            <TopResultCard key={u.id} user={u} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Jobs */}
                            {(tab === 'all' || tab === 'jobs') && filteredJobs.length > 0 && (
                                <div>
                                    <SectionHeader
                                        label="Jobs & Opportunities"
                                        count={filteredJobs.length}
                                        onSeeAll={tab === 'all' && filteredJobs.length > 4 ? () => handleTabChange('jobs') : undefined}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredJobs.slice(0, tab === 'all' ? 4 : 20).map(j => (
                                            <JobResultCard key={j.id} job={j} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Posts */}
                            {(tab === 'all' || tab === 'posts') && filteredPosts.length > 0 && (
                                <div>
                                    <SectionHeader
                                        label="Latest Posts & Discussions"
                                        count={filteredPosts.length}
                                        onSeeAll={tab === 'all' && filteredPosts.length > 4 ? () => handleTabChange('posts') : undefined}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredPosts.slice(0, tab === 'all' ? 4 : 20).map(p => (
                                            <LatestPostCard key={p.id} post={p} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Courses */}
                            {(tab === 'all' || tab === 'courses') && filteredCourses.length > 0 && (
                                <div>
                                    <SectionHeader
                                        label="Courses & Learning"
                                        count={filteredCourses.length}
                                        onSeeAll={tab === 'all' && filteredCourses.length > 3 ? () => handleTabChange('courses') : undefined}
                                    />
                                    <div className="space-y-2.5">
                                        {filteredCourses.slice(0, tab === 'all' ? 3 : 20).map(c => (
                                            <CourseCard key={c.id} course={c} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Rail (Desktop only xl+) */}
                <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 pt-1">
                    <FiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        onReset={handleResetFilters}
                        activeCount={activeFilterCount}
                    />
                    <TrendingSearches onPick={handleExplicitSearch} />
                    <SuggestedForYou />
                </aside>
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={null}>
            <SearchPageInner />
        </Suspense>
    )
}
