'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Users, FileText, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { searchUsers, searchPosts, searchCourses } from '@/lib/actions/search'
import { toPublicStorageUrl } from '@/lib/supabase-image'

type UserResult = { id: string; username: string; display_name: string; avatar_url: string | null }
type PostResult = { id: string; caption: string | null; created_at: string; author: { username: string; display_name: string; avatar_url: string | null } | null }
type CourseResult = { id: string; title: string; thumbnail_url: string | null; price: number; instructor: { display_name: string; avatar_url: string | null } | null }

type Tab = 'all' | 'people' | 'posts' | 'courses'

function getInitials(name?: string | null)
{
    if (!name) return 'U'
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(d: string)
{
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function Skeletons({ count = 4 }: { count?: number })
{
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded-full w-1/3" />
                        <div className="h-2.5 bg-muted rounded-full w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Empty / idle state ───────────────────────────────────────────────────────

function IdleState()
{
    const TRENDING = ['Entrepreneurs', 'Philanthropy', 'StartupNG', 'Education', 'Impact']
    return (
        <div className="flex flex-col items-center gap-5 py-12 text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#065f46,#0f766e)' }}>
                <Search className="w-8 h-8 text-white" />
            </div>
            <div>
                <p className="font-bold text-foreground text-lg">Discover HubNovo</p>
                <p className="text-sm text-muted-foreground mt-1">Search for people, posts, and courses</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {TRENDING.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-border text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors">
                        <Sparkles className="w-3 h-3" /> {t}
                    </span>
                ))}
            </div>
        </div>
    )
}

function NoResults({ query }: { query: string })
{
    return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-muted-foreground">Try different keywords or check spelling</p>
        </div>
    )
}

// ── Result cards ─────────────────────────────────────────────────────────────

function UserCard({ user }: { user: UserResult })
{
    return (
        <Link href={`/app/profile/${user.username}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-border hover:border-primary/40 hover:shadow-md transition-all group">
            <Avatar className="h-11 w-11 shrink-0 border-2 border-border group-hover:border-primary/40 transition-colors">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{getInitials(user.display_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{user.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
    )
}

function PostCard({ post }: { post: PostResult })
{
    return (
        <Link href={`/app/feed/${post.id}`}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-border hover:border-primary/40 hover:shadow-md transition-all group">
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                <AvatarImage src={post.author?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(post.author?.display_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-foreground">@{post.author?.username ?? 'unknown'}</span>
                    <span className="text-[10px] text-muted-foreground">· {timeAgo(post.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors">
                    {post.caption || <em className="text-muted-foreground">Media post</em>}
                </p>
            </div>
        </Link>
    )
}

function CourseCard({ course }: { course: CourseResult })
{
    const thumb = toPublicStorageUrl(course.thumbnail_url)
    return (
        <Link href={`/app/learn/${course.id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-border hover:border-primary/40 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
                {thumb
                    ? <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#065f46,#0f766e)' }}><BookOpen className="w-6 h-6 text-white/80" /></div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{course.title}</p>
                <p className="text-xs text-muted-foreground truncate">{course.instructor?.display_name ?? 'Instructor'}</p>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={course.price === 0
                        ? { background: '#d1fae5', color: '#065f46' }
                        : { background: '#f3f4f6', color: '#374151' }}>
                    {course.price === 0 ? 'Free' : `₦${course.price.toLocaleString()}`}
                </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
        </Link>
    )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number })
{
    return (
        <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'hsl(166,76%,40%)' }}>
                <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">({count})</span>
        </div>
    )
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number })
{
    return (
        <button onClick={onClick}
            className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${active
                ? 'text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground bg-white border border-border'
                }`}
            style={active ? { background: 'hsl(166,76%,40%)' } : {}}>
            {label}
            {badge != null && badge > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/30 text-[10px] font-bold">{badge}</span>
            )}
        </button>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SearchPage()
{
    const [query, setQuery] = useState('')
    const [debounced, setDebounced] = useState('')
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

    return (
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

            {/* ── Hero header ── */}
            <div className="relative overflow-hidden rounded-2xl p-5 text-white"
                style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)' }}>
                <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle,#34d399,transparent)' }} />
                <h1 className="text-xl font-black mb-0.5">Search</h1>
                <p className="text-sm opacity-70">Find people, posts and courses</p>

                {/* Big search input */}
                <div className="relative mt-4" onClick={() => inputRef.current?.focus()}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/60 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="search"
                        placeholder="Search HubNovo…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(8px)' }}
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* ── Tabs (only shown after searching) ── */}
            {hasSearched && !loading && totalResults > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
                    <TabBtn label="All" active={tab === 'all'} onClick={() => setTab('all')}
                        badge={tab !== 'all' ? totalResults : undefined} />
                    <TabBtn label="People" active={tab === 'people'} onClick={() => setTab('people')} badge={users.length} />
                    <TabBtn label="Posts" active={tab === 'posts'} onClick={() => setTab('posts')} badge={posts.length} />
                    <TabBtn label="Courses" active={tab === 'courses'} onClick={() => setTab('courses')} badge={courses.length} />
                </div>
            )}

            {/* ── Results ── */}
            {loading ? (
                <Skeletons count={5} />
            ) : !hasSearched ? (
                <IdleState />
            ) : totalResults === 0 ? (
                <NoResults query={debounced} />
            ) : (
                <div className="space-y-3">
                    {/* People */}
                    {(tab === 'all' || tab === 'people') && users.length > 0 && (
                        <div>
                            <SectionHeader icon={Users} label="People" count={users.length} />
                            <div className="space-y-2">
                                {users.slice(0, tab === 'all' ? 3 : 20).map(u => <UserCard key={u.id} user={u} />)}
                                {tab === 'all' && users.length > 3 && (
                                    <button onClick={() => setTab('people')}
                                        className="w-full py-2 text-xs font-semibold text-primary hover:underline text-center">
                                        <span className="inline-flex items-center gap-1">See all {users.length} people <ArrowRight className="w-3 h-3" /></span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    {(tab === 'all' || tab === 'posts') && posts.length > 0 && (
                        <div>
                            <SectionHeader icon={FileText} label="Posts" count={posts.length} />
                            <div className="space-y-2">
                                {posts.slice(0, tab === 'all' ? 3 : 20).map(p => <PostCard key={p.id} post={p} />)}
                                {tab === 'all' && posts.length > 3 && (
                                    <button onClick={() => setTab('posts')}
                                        className="w-full py-2 text-xs font-semibold text-primary hover:underline text-center">
                                        <span className="inline-flex items-center gap-1">See all {posts.length} posts <ArrowRight className="w-3 h-3" /></span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Courses */}
                    {(tab === 'all' || tab === 'courses') && courses.length > 0 && (
                        <div>
                            <SectionHeader icon={BookOpen} label="Courses" count={courses.length} />
                            <div className="space-y-2">
                                {courses.slice(0, tab === 'all' ? 3 : 20).map(c => <CourseCard key={c.id} course={c} />)}
                                {tab === 'all' && courses.length > 3 && (
                                    <button onClick={() => setTab('courses')}
                                        className="w-full py-2 text-xs font-semibold text-primary hover:underline text-center">
                                        <span className="inline-flex items-center gap-1">See all {courses.length} courses <ArrowRight className="w-3 h-3" /></span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
