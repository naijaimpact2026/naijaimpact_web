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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createPost } from '@/lib/actions/posts'
import type { PostWithAuthor, User } from '@/lib/types'
import { Image as ImageIcon, Globe2, Loader2, Hash, X } from 'lucide-react'
import { toast } from 'sonner'

const MAX_LEN = 5000

interface CreatePostModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    onPostCreated: (post: PostWithAuthor) => void
    activeTopic?: string | null
    startWithMedia?: boolean
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
}: CreatePostModalProps)
{
    const [caption, setCaption] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [showMedia, setShowMedia] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Sync media toggle when opened with media intent
    useEffect(() =>
    {
        if (open)
        {
            if (startWithMedia) setShowMedia(true)
            setTimeout(() => textareaRef.current?.focus(), 150)
        }
    }, [open, startWithMedia])

    const canSubmit = !isSubmitting && (caption.trim().length > 0 || uploadedFiles.length > 0) && caption.length <= MAX_LEN

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
            const newPost = await createPost(caption.trim(), type, mediaUrls)
            toast.success('Post created!')
            // Reset state
            setCaption('')
            setUploadedFiles([])
            setShowMedia(false)
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

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) =>
            {
                if (isSubmitting) return
                if (!isOpen)
                {
                    // Reset if empty, or keep for user if they accidentally clicked outside
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
                    {/* User profile row */}
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
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full mt-1">
                                <Globe2 className="w-3 h-3 text-primary" /> Public
                            </span>
                        </div>
                    </div>

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
