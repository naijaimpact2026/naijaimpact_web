'use client'

import { useState, useEffect, useRef } from 'react'
import
{
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog'
import
{
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createPost } from '@/lib/actions/posts'
import { searchUsers } from '@/lib/actions/search'
import type { PostWithAuthor, User } from '@/lib/types'
import
{
    Image as ImageIcon, Globe2, Loader2, Hash, X, Users, Lock,
    ChevronDown, Tag, SlidersHorizontal, Check, CalendarClock, Sparkles
} from 'lucide-react'
import { toast } from '@/components/toast'

const MAX_LEN = 5000

type AudienceKey = 'public' | 'connections' | 'group' | 'only-me'

const AUDIENCE_OPTIONS: Array<{
    key: AudienceKey
    icon: typeof Globe2
    label: string
    desc: string
}> = [
    { key: 'public', icon: Globe2, label: 'Public', desc: 'Anyone on Hubnovo' },
    { key: 'connections', icon: Users, label: 'My Connections', desc: 'Only people you follow or are connected with' },
    { key: 'group', icon: Users, label: 'Group', desc: 'Post to a community topic' },
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

interface CreatePostModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    onPostCreated: (post: PostWithAuthor) => void
    activeTopic?: string | null
    startWithMedia?: boolean
    startWithTagging?: boolean
}

function getInitials(name: string | null | undefined): string
{
    if (!name) return 'U'
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function CreatePostModal({
    open,
    onOpenChange,
    user,
    onPostCreated,
    activeTopic,
    startWithMedia = false,
    startWithTagging = false,
}: CreatePostModalProps)
{
    const [caption, setCaption] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [showMedia, setShowMedia] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Dynamic Form States
    const [audience, setAudience] = useState<AudienceKey>('public')
    const [selectedGroupId, setSelectedGroupId] = useState<string>('')
    const [allowComments, setAllowComments] = useState(true)
    const [allowSharing, setAllowSharing] = useState(true)
    const [featurePost, setFeaturePost] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduledDateTime, setScheduledDateTime] = useState('')
    const [showMoreOptions, setShowMoreOptions] = useState(false)

    // Tag People States
    const [showTagSection, setShowTagSection] = useState(false)
    const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([])
    const [tagInput, setTagInput] = useState('')
    const [tagResults, setTagResults] = useState<TaggedUser[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [showTagMenu, setShowTagMenu] = useState(false)
    const tagMenuRef = useRef<HTMLDivElement>(null)

    // Sync media toggle when opened with media intent
    useEffect(() =>
    {
        if (open)
        {
            if (startWithMedia) setShowMedia(true)
            if (startWithTagging) setShowTagSection(true)
            if (activeTopic)
            {
                const matchedGroup = COMMUNITY_GROUPS.find(
                    (g) => g.tag.toLowerCase() === activeTopic.toLowerCase()
                )
                if (matchedGroup)
                {
                    setSelectedGroupId(matchedGroup.id)
                    setAudience('group')
                }
            }
            setTimeout(() => textareaRef.current?.focus(), 150)
        }
    }, [open, startWithMedia, startWithTagging, activeTopic])

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

    const canSubmit = !isSubmitting && (caption.trim().length > 0 || uploadedFiles.length > 0) && caption.length <= MAX_LEN

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

    function handleAppendTopic()
    {
        if (!activeTopic) return
        const topicTag = `#${activeTopic}`
        if (!caption.includes(topicTag))
        {
            setCaption((prev) => (prev ? `${prev} ${topicTag}` : topicTag))
            textareaRef.current?.focus()
        }
    }

    async function handleSubmit(e?: React.FormEvent)
    {
        if (e) e.preventDefault()
        if (!canSubmit || isSubmitting) return

        let captionValue = caption.trim()

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
            const newPost = await createPost(captionValue, type, mediaUrls, {
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

            // Reset state
            setCaption('')
            setUploadedFiles([])
            setShowMedia(false)
            setTaggedUsers([])
            setSelectedGroupId('')
            setAudience('public')
            setAllowComments(true)
            setAllowSharing(true)
            setFeaturePost(false)
            setIsScheduling(false)
            setScheduledDateTime('')
            setShowMoreOptions(false)
            setShowTagSection(false)

            onOpenChange(false)
            onPostCreated(newPost)
        } catch (err)
        {
            console.error('Failed to create post:', err)
            toast.error('Failed to create post. Please try again.')
        } finally
        {
            setIsSubmitting(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>)
    {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter')
        {
            e.preventDefault()
            handleSubmit()
        }
    }

    const currentAudience = AUDIENCE_OPTIONS.find((a) => a.key === audience) ?? AUDIENCE_OPTIONS[0]
    const AudienceIcon = currentAudience.icon
    const currentGroup = COMMUNITY_GROUPS.find((g) => g.id === selectedGroupId)

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) =>
            {
                if (isSubmitting) return
                if (!isOpen)
                {
                    if (!caption.trim() && uploadedFiles.length === 0)
                    {
                        setShowMedia(false)
                    }
                }
                onOpenChange(isOpen)
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-border/80 flex flex-row items-center justify-between">
                    <DialogTitle className="text-base font-bold text-foreground">
                        Create Post
                    </DialogTitle>
                    <DialogClose
                        disabled={isSubmitting}
                        className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                    {/* User profile row + interactive controls */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                                <AvatarImage src={user?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {getInitials(user?.display_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">
                                    {user?.display_name ?? 'You'}
                                </p>

                                {/* Post Audience selector dropdown */}
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/80 hover:bg-muted px-2.5 py-0.5 rounded-full transition-colors border border-border/60"
                                            >
                                                <AudienceIcon className="w-3 h-3 text-primary" />
                                                <span>{currentAudience.label}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56 p-1.5 shadow-xl">
                                            <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Who can see your post?
                                            </div>
                                            {AUDIENCE_OPTIONS.map((opt) =>
                                            {
                                                const Icon = opt.icon
                                                const isSelected = audience === opt.key
                                                return (
                                                    <DropdownMenuItem
                                                        key={opt.key}
                                                        onClick={() => handleAudienceChange(opt.key)}
                                                        className={`flex items-start gap-2.5 py-2 px-2 rounded-lg cursor-pointer ${
                                                            isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-medium flex items-center justify-between">
                                                                {opt.label}
                                                                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                                {opt.desc}
                                                            </p>
                                                        </div>
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Group selection dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors border ${
                                                    selectedGroupId
                                                        ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                                                        : 'text-muted-foreground bg-muted/60 hover:bg-muted border-border/60'
                                                }`}
                                            >
                                                <span>{currentGroup ? `${currentGroup.emoji} ${currentGroup.name}` : '+ Add to Group'}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56 p-1.5 shadow-xl">
                                            <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Community Groups
                                            </div>
                                            <DropdownMenuItem
                                                onClick={() => handleGroupChange('')}
                                                className={`text-xs py-1.5 px-2 rounded-lg cursor-pointer ${
                                                    !selectedGroupId ? 'bg-primary/10 text-primary font-semibold' : ''
                                                }`}
                                            >
                                                <span>None (General Feed)</span>
                                                {!selectedGroupId && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {COMMUNITY_GROUPS.map((g) =>
                                            {
                                                const isSelected = selectedGroupId === g.id
                                                return (
                                                    <DropdownMenuItem
                                                        key={g.id}
                                                        onClick={() => handleGroupChange(g.id)}
                                                        className={`flex items-center justify-between text-xs py-2 px-2 rounded-lg cursor-pointer ${
                                                            isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span>{g.emoji}</span>
                                                            <span>{g.name}</span>
                                                        </span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Top quick actions: Tag people & More Options buttons */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setShowTagSection((prev) => !prev)}
                                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                                    showTagSection || taggedUsers.length > 0
                                        ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                                        : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                                }`}
                                title="Tag people in this post"
                            >
                                <Tag className="w-3.5 h-3.5" />
                                <span>Tag</span>
                                {taggedUsers.length > 0 && (
                                    <span className="ml-0.5 px-1.5 py-0.2 bg-primary text-white text-[10px] rounded-full font-bold">
                                        {taggedUsers.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowMoreOptions((prev) => !prev)}
                                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                                    showMoreOptions || !allowComments || !allowSharing || featurePost || isScheduling
                                        ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                                        : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                                }`}
                                title="Post options"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Options</span>
                            </button>
                        </div>
                    </div>

                    {/* Tag People expanded panel */}
                    {showTagSection && (
                        <div ref={tagMenuRef} className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-primary" /> Tag People
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowTagSection(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Done
                                </button>
                            </div>

                            {/* Tagged users chips */}
                            {taggedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {taggedUsers.map((u) => (
                                        <span
                                            key={u.id}
                                            className="inline-flex items-center gap-1.5 bg-card border border-border text-foreground text-xs pl-1.5 pr-2 py-0.5 rounded-full shadow-sm"
                                        >
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={u.avatar_url ?? undefined} />
                                                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                                    {getInitials(u.display_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>@{u.username}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTaggedUser(u.id)}
                                                className="text-muted-foreground hover:text-destructive ml-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* User search input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Search by name or @username…"
                                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {isSearchingUsers && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-2.5 top-2.5" />
                                )}

                                {/* Search autocomplete dropdown */}
                                {showTagMenu && tagResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border shadow-xl rounded-xl p-1 z-30 space-y-0.5">
                                        {tagResults.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => handleAddTaggedUser(u)}
                                                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/80 transition-colors text-left"
                                            >
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={u.avatar_url ?? undefined} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                        {getInitials(u.display_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate leading-tight text-foreground">{u.display_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate leading-tight">@{u.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* More Options panel */}
                    {showMoreOptions && (
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-border/60">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Post Settings
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowMoreOptions(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Hide
                                </button>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                {/* Allow comments */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Allow Comments</p>
                                        <p className="text-[11px] text-muted-foreground">Let members comment on your post</p>
                                    </div>
                                    <Switch
                                        checked={allowComments}
                                        onCheckedChange={setAllowComments}
                                    />
                                </div>

                                {/* Allow sharing */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Allow Sharing</p>
                                        <p className="text-[11px] text-muted-foreground">Enable sharing link and social sharing</p>
                                    </div>
                                    <Switch
                                        checked={allowSharing}
                                        onCheckedChange={setAllowSharing}
                                    />
                                </div>

                                {/* Feature this post */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Feature this post</p>
                                        <p className="text-[11px] text-muted-foreground">Pin to top of your profile showcase</p>
                                    </div>
                                    <Switch
                                        checked={featurePost}
                                        onCheckedChange={setFeaturePost}
                                    />
                                </div>

                                {/* Schedule post */}
                                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                    <div>
                                        <p className="font-medium text-foreground">Schedule Post</p>
                                        <p className="text-[11px] text-muted-foreground">Publish automatically at a future time</p>
                                    </div>
                                    <Switch
                                        checked={isScheduling}
                                        onCheckedChange={(val) =>
                                        {
                                            setIsScheduling(val)
                                            if (val && !scheduledDateTime)
                                            {
                                                const d = new Date()
                                                d.setHours(d.getHours() + 1, 0, 0, 0)
                                                setScheduledDateTime(d.toISOString().slice(0, 16))
                                            }
                                        }}
                                    />
                                </div>

                                {isScheduling && (
                                    <div className="pt-1">
                                        <input
                                            type="datetime-local"
                                            value={scheduledDateTime}
                                            onChange={(e) => setScheduledDateTime(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Active topic suggestion chip */}
                    {activeTopic && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAppendTopic}
                                className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors px-2.5 py-1 rounded-full"
                                title={`Click to add #${activeTopic} to your post`}
                            >
                                <Hash className="w-3 h-3" />
                                Add #{activeTopic}
                            </button>
                            <span className="text-[11px] text-muted-foreground">posting in community</span>
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What's on your mind? Share ideas, updates, or questions…"
                            rows={5}
                            disabled={isSubmitting}
                            className="w-full resize-none border border-border/80 focus-visible:ring-primary text-sm p-3.5 rounded-xl bg-background placeholder:text-muted-foreground/70"
                        />
                        <div className="flex items-center justify-between pt-1.5 px-0.5">
                            <span className="text-[11px] text-muted-foreground">
                                Press <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border">⌘/Ctrl+Enter</kbd> to post
                            </span>
                            <span
                                className={`text-xs tabular-nums ${caption.length > MAX_LEN ? 'text-destructive font-bold' : 'text-muted-foreground'
                                    }`}
                            >
                                {caption.length}/{MAX_LEN.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Media uploader area */}
                    {showMedia && (
                        <div className="pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <ImageIcon className="w-4 h-4 text-primary" /> Add Photos or Video
                                </span>
                                {uploadedFiles.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowMedia(false)}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Hide
                                    </button>
                                )}
                            </div>
                            <MediaUploader
                                onUploadComplete={setUploadedFiles}
                                maxImages={10}
                                maxVideos={1}
                            />
                        </div>
                    )}
                </div>

                {/* Footer toolbar & submit */}
                <div className="px-6 py-3.5 border-t border-border/80 bg-muted/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={showMedia ? 'secondary' : 'outline'}
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => setShowMedia((prev) => !prev)}
                            className="h-8 gap-1.5 text-xs font-medium"
                        >
                            <ImageIcon className="w-3.5 h-3.5 text-primary" />
                            <span>Photo/Video</span>
                            {uploadedFiles.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 bg-primary text-white text-[10px] rounded-full font-bold">
                                    {uploadedFiles.length}
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={!canSubmit}
                            onClick={() => handleSubmit()}
                            className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-white min-w-[76px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                    Posting…
                                </>
                            ) : (
                                'Post'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
