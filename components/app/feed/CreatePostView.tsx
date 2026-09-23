'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/toast'
import Link from 'next/link'
import
{
    Image as ImageIcon, FileText, BarChart2, Calendar, HandCoins, MapPin,
    Globe2, Users, Lock, Info, ChevronRight, CalendarClock, X, Check, Loader2
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createPost } from '@/lib/actions/posts'
import { searchUsers } from '@/lib/actions/search'
import type { User } from '@/lib/types'

const MAX_LEN = 5000

const schema = z.object({
    caption: z.string().max(MAX_LEN, `Caption must be ${MAX_LEN} characters or less`).optional().default(''),
})
type FormValues = z.infer<typeof schema>

// Photo/Video is functional
const COMPOSER_ACTIONS = [
    { icon: ImageIcon, label: 'Photo/Video', functional: true },
    { icon: FileText, label: 'Document', functional: false },
    { icon: BarChart2, label: 'Poll', functional: false },
    { icon: Calendar, label: 'Event', functional: false },
    { icon: HandCoins, label: 'Opportunity', functional: false },
    { icon: MapPin, label: 'Location', functional: false },
]

type AudienceKey = 'public' | 'connections' | 'group' | 'only-me'

const AUDIENCE_OPTIONS: Array<{
    key: AudienceKey
    icon: typeof Globe2
    label: string
    desc: string
}> = [
        { key: 'public', icon: Globe2, label: 'Public', desc: 'Anyone on Hubnovo' },
        { key: 'connections', icon: Users, label: 'My Connections', desc: 'Only people you follow or are connected with' },
        { key: 'group', icon: Users, label: 'Group', desc: 'Post to a community group' },
        { key: 'only-me', icon: Lock, label: 'Only Me', desc: 'Visible only to you' },
    ]

const COMMUNITY_GROUPS = [
    { id: 'entrepreneurs', name: 'Entrepreneurs', tag: 'entrepreneur', emoji: '💼' },
    { id: 'tech', name: 'Tech & Innovation', tag: 'tech', emoji: '💡' },
    { id: 'agriculture', name: 'Agriculture', tag: 'agriculture', emoji: '🌾' },
    { id: 'creative', name: 'Creative Hub', tag: 'creative', emoji: '🎨' },
    { id: 'health', name: 'Health & Wellness', tag: 'health', emoji: '🌱' },
    { id: 'faith', name: 'Faith & Purpose', tag: 'faith', emoji: '✨' },
]

interface TaggedUser
{
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function CreatePostView({ user }: { user: User | null })
{
    const router = useRouter()
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Dynamic Form States
    const [audience, setAudience] = useState<AudienceKey>('public')
    const [selectedGroupId, setSelectedGroupId] = useState<string>('')
    const [allowComments, setAllowComments] = useState(true)
    const [allowSharing, setAllowSharing] = useState(true)
    const [featurePost, setFeaturePost] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduledDateTime, setScheduledDateTime] = useState('')

    // Tag People States
    const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([])
    const [tagInput, setTagInput] = useState('')
    const [tagResults, setTagResults] = useState<TaggedUser[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [showTagMenu, setShowTagMenu] = useState(false)
    const tagMenuRef = useRef<HTMLDivElement>(null)

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { caption: '' },
    })

    const caption = watch('caption') ?? ''

    // Debounced search for users to tag
    useEffect(() =>
    {
        const q = tagInput.trim().replace(/^@/, '')
        if (!q)
        {
            setTagResults([])
            setShowTagMenu(false)
            return
        }

        const timer = setTimeout(async () =>
        {
            setIsSearchingUsers(true)
            try
            {
                const results = await searchUsers(q)
                const existingIds = new Set(taggedUsers.map((u) => u.id))
                const filtered = (results || []).filter((u) => !existingIds.has(u.id)).slice(0, 5)
                setTagResults(filtered as TaggedUser[])
                setShowTagMenu(filtered.length > 0)
            } catch (err)
            {
                console.error('searchUsers error:', err)
            } finally
            {
                setIsSearchingUsers(false)
            }
        }, 220)

        return () => clearTimeout(timer)
    }, [tagInput, taggedUsers])

    // Close tag menu when clicking outside
    useEffect(() =>
    {
        function handleClickOutside(event: MouseEvent)
        {
            if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node))
            {
                setShowTagMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleAddTaggedUser(u: TaggedUser)
    {
        setTaggedUsers((prev) => [...prev, u])
        setTagInput('')
        setShowTagMenu(false)
    }

    function handleRemoveTaggedUser(userId: string)
    {
        setTaggedUsers((prev) => prev.filter((u) => u.id !== userId))
    }

    function handleGroupChange(groupId: string)
    {
        setSelectedGroupId(groupId)
        if (groupId)
        {
            setAudience('group')
        } else if (audience === 'group')
        {
            setAudience('public')
        }
    }

    function handleAudienceChange(key: AudienceKey)
    {
        setAudience(key)
        if (key === 'group' && !selectedGroupId)
        {
            setSelectedGroupId(COMMUNITY_GROUPS[0].id)
        }
    }

    async function onSubmit(values: FormValues)
    {
        if (isSubmitting) return
        let captionValue = (values.caption ?? '').trim()

        if (!captionValue && uploadedFiles.length === 0)
        {
            toast.error('Add a caption or media before posting.')
            return
        }

        // 1. If a community group is selected, ensure the topic hashtag is in the post
        if (selectedGroupId)
        {
            const group = COMMUNITY_GROUPS.find((g) => g.id === selectedGroupId)
            if (group && !captionValue.toLowerCase().includes(`#${group.tag.toLowerCase()}`))
            {
                captionValue = captionValue ? `${captionValue}\n\n#${group.tag}` : `#${group.tag}`
            }
        }

        // 2. If tagged users exist, append them to the caption if not already present
        if (taggedUsers.length > 0)
        {
            const missingMentions = taggedUsers
                .filter((u) => !captionValue.includes(`@${u.username}`))
                .map((u) => `@${u.username}`)
                .join(' ')
            if (missingMentions)
            {
                captionValue = captionValue ? `${captionValue}\n\nwith ${missingMentions}` : `with ${missingMentions}`
            }
        }

        let type: 'text' | 'image' | 'video' = 'text'
        if (uploadedFiles.length > 0)
        {
            type = uploadedFiles.some((f) => f.mediaType === 'video') ? 'video' : 'image'
        }

        const mediaUrls = uploadedFiles.map((f) => ({
            url: f.secure_url,
            media_type: f.mediaType as 'image' | 'video',
            width: f.width,
            height: f.height,
            duration_s: f.duration,
        }))

        setIsSubmitting(true)
        try
        {
            await createPost(captionValue, type, mediaUrls, {
                allow_comments: allowComments,
                allow_sharing: allowSharing,
                is_featured: featurePost,
                audience: audience,
                scheduled_at: isScheduling && scheduledDateTime ? scheduledDateTime : null,
                group_id: selectedGroupId || null,
            })

            if (isScheduling && scheduledDateTime)
            {
                const formattedDate = new Date(scheduledDateTime).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                toast.success(`Post scheduled for ${formattedDate}!`)
            } else
            {
                toast.success('Post created!')
            }

            router.push('/app/feed')
        } catch (err)
        {
            console.error('createPost error:', err)
            toast.error('Failed to create post. Please try again.')
            setIsSubmitting(false)
        }
    }

    const currentGroup = COMMUNITY_GROUPS.find((g) => g.id === selectedGroupId)

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            <h1 className="font-display text-2xl font-extrabold text-secondary mb-5">Create Post</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main composer */}
                <div className="flex-1 w-full min-w-0 rounded-2xl bg-card border border-border shadow-sm p-5 space-y-4">
                    {/* Author + dynamic audience badge */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                            <AvatarImage src={user?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{user?.display_name ?? 'You'}</p>
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-full mt-0.5 font-medium transition-colors">
                                {audience === 'public' && (
                                    <>
                                        <Globe2 className="w-3.5 h-3.5 text-primary" /> Public
                                    </>
                                )}
                                {audience === 'connections' && (
                                    <>
                                        <Users className="w-3.5 h-3.5 text-secondary" /> My Connections
                                    </>
                                )}
                                {audience === 'group' && (
                                    <>
                                        <Users className="w-3.5 h-3.5 text-primary" />
                                        <span>{currentGroup ? `${currentGroup.emoji} ${currentGroup.name}` : 'Group'}</span>
                                    </>
                                )}
                                {audience === 'only-me' && (
                                    <>
                                        <Lock className="w-3.5 h-3.5 text-amber-500" /> Only Me
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    <Textarea
                        {...register('caption')}
                        placeholder="What's on your mind? Share an update, ask a question, or inspire the community…"
                        rows={6}
                        className="resize-none border-border rounded-xl text-sm"
                        disabled={isSubmitting}
                        aria-label="Post caption"
                    />
                    <div className="flex items-center justify-between mt-1">
                        {errors.caption ? (
                            <p className="text-xs text-destructive">{errors.caption.message}</p>
                        ) : <span />}
                        <span className={`text-xs tabular-nums ${caption.length > MAX_LEN ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {caption.length}/{MAX_LEN.toLocaleString()}
                        </span>
                    </div>

                    {/* Composer action row */}
                    <div className="flex items-center gap-1 pt-3 border-t border-border flex-wrap">
                        {COMPOSER_ACTIONS.map(({ icon: Icon, label, functional }) => (
                            <span
                                key={label}
                                title={functional ? undefined : 'Coming soon'}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${functional
                                    ? 'text-primary'
                                    : 'text-muted-foreground/40 cursor-default'
                                    }`}
                            >
                                <Icon className="w-4 h-4" /> {label}
                            </span>
                        ))}
                    </div>

                    {/* Media uploader */}
                    <div>
                        <MediaUploader onUploadComplete={setUploadedFiles} maxImages={10} maxVideos={1} />
                    </div>

                    {/* Dynamic: Add to a Group */}
                    <div className="pt-2 border-t border-border/70 space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Users className="w-3.5 h-3.5 text-primary" /> Add to a Group <span className="font-normal text-muted-foreground">(Optional)</span>
                        </label>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => handleGroupChange(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                            <option value="">None (General Feed)</option>
                            {COMMUNITY_GROUPS.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.emoji} {g.name} (#{g.tag})
                                </option>
                            ))}
                        </select>
                        {selectedGroupId && (
                            <p className="text-[11px] text-muted-foreground">
                                Post will be shared and tagged with <span className="text-primary font-medium">#{currentGroup?.tag}</span>.
                            </p>
                        )}
                    </div>

                    {/* Dynamic: Tag People */}
                    <div ref={tagMenuRef} className="pt-2 border-t border-border/70 space-y-2 relative">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> Tag People <span className="font-normal text-muted-foreground">(Optional)</span>
                        </label>

                        {/* Tagged user chips */}
                        {taggedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                                {taggedUsers.map((u) => (
                                    <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20"
                                    >
                                        <Avatar className="w-4 h-4">
                                            <AvatarImage src={u.avatar_url ?? undefined} />
                                            <AvatarFallback className="text-[9px]">{getInitials(u.display_name)}</AvatarFallback>
                                        </Avatar>
                                        <span>{u.display_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTaggedUser(u.id)}
                                            className="hover:text-destructive transition-colors ml-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onFocus={() => { if (tagResults.length > 0) setShowTagMenu(true) }}
                                placeholder="Search people by name or username to tag…"
                                disabled={isSubmitting}
                                className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/60"
                            />
                            {isSearchingUsers && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                                </div>
                            )}

                            {showTagMenu && tagResults.length > 0 && (
                                <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
                                    {tagResults.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => handleAddTaggedUser(u)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-muted text-sm transition-colors"
                                        >
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage src={u.avatar_url ?? undefined} />
                                                <AvatarFallback className="text-xs font-bold">{getInitials(u.display_name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-foreground truncate">{u.display_name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">@{u.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                            <Link href="/app/feed">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || caption.length > MAX_LEN}
                            className="bg-primary hover:bg-primary/90 text-white min-w-[90px]"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isScheduling && scheduledDateTime ? 'Scheduling…' : 'Posting…'}
                                </span>
                            ) : (
                                isScheduling && scheduledDateTime ? 'Schedule Post' : 'Post'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right rail */}
                <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                    {/* Post Audience — fully dynamic */}
                    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                        <h3 className="font-bold text-sm text-foreground mb-0.5">Post Audience</h3>
                        <p className="text-[11px] text-muted-foreground mb-3">Choose who can see your post</p>
                        <div className="space-y-2.5">
                            {AUDIENCE_OPTIONS.map((a) => (
                                <label
                                    key={a.key}
                                    onClick={() => handleAudienceChange(a.key)}
                                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${audience === a.key
                                        ? 'border-primary/50 bg-primary/5 shadow-xs'
                                        : 'border-transparent hover:bg-muted/50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="audience"
                                        value={a.key}
                                        checked={audience === a.key}
                                        onChange={() => handleAudienceChange(a.key)}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <a.icon className={`w-4 h-4 mt-0.5 shrink-0 ${audience === a.key ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{a.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-snug">{a.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* More Options — fully dynamic with real switches & scheduler */}
                    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                        <h3 className="font-bold text-sm text-foreground mb-3">More Options</h3>
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">Allow comments</span>
                                <Switch
                                    checked={allowComments}
                                    onCheckedChange={setAllowComments}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">Allow sharing</span>
                                <Switch
                                    checked={allowSharing}
                                    onCheckedChange={setAllowSharing}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-medium text-foreground">Feature this post</span>
                                    <p className="text-[10px] text-muted-foreground">Highlight on your profile</p>
                                </div>
                                <Switch
                                    checked={featurePost}
                                    onCheckedChange={setFeaturePost}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Schedule post */}
                            <div className="pt-2 border-t border-border/80 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduling((prev) => !prev)}
                                    disabled={isSubmitting}
                                    className="flex items-center justify-between w-full text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        {isScheduling ? 'Scheduling active' : 'Schedule post'}
                                    </span>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isScheduling ? 'rotate-90' : ''}`} />
                                </button>

                                {isScheduling && (
                                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                                        <label className="text-[11px] font-medium text-muted-foreground block">
                                            Publish date & time:
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledDateTime}
                                            onChange={(e) => setScheduledDateTime(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                                        />
                                        {scheduledDateTime && (
                                            <button
                                                type="button"
                                                onClick={() => { setScheduledDateTime(''); setIsScheduling(false); }}
                                                className="text-[10px] text-muted-foreground hover:text-destructive underline"
                                            >
                                                Clear schedule
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Post Guidelines */}
                    <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                        <h3 className="font-bold text-sm text-secondary flex items-center gap-1.5 mb-2">
                            <Info className="w-3.5 h-3.5 text-primary" /> Post Guidelines
                        </h3>
                        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                            <li>Be respectful and follow community standards.</li>
                            <li>Do not share false or misleading information.</li>
                            <li>No hate speech, violence or illegal content.</li>
                            <li>Keep personal data safe.</li>
                        </ul>
                    </div>
                </aside>
            </form>
        </div>
    )
}
