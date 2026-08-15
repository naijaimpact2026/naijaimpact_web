'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createPost } from '@/lib/actions/posts'
import type { PostWithAuthor } from '@/lib/types'

// ─── Schema ────────────────────────────────────────────────────────────────

const schema = z.object({
    caption: z
        .string()
        .max(2200, 'Caption must be 2200 characters or less')
        .optional()
        .default(''),
})

type FormValues = z.infer<typeof schema>

// ─── Props ─────────────────────────────────────────────────────────────────

export interface PostComposerProps
{
    currentUserId: string
    onSuccess: (post: PostWithAuthor) => void
    onClose: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function PostComposer({
    currentUserId,
    onSuccess,
    onClose,
}: PostComposerProps)
{
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { caption: '' },
    })

    const caption = watch('caption') ?? ''
    const captionLength = caption.length
    const captionNearLimit = captionLength > 1900

    // ── Submit ──────────────────────────────────────────────────────────────

    async function onSubmit(values: FormValues)
    {
        if (isSubmitting) return

        const captionValue = values.caption ?? ''

        // At least caption or media required
        if (!captionValue.trim() && uploadedFiles.length === 0)
        {
            toast.error('Add a caption or media before posting.')
            return
        }

        // Check no files are still uploading
        // (MediaUploader only calls onUploadComplete for done files, so all files in
        //  uploadedFiles are already uploaded)

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
            const newPost = await createPost(captionValue, type, mediaUrls)
            toast.success('Post created!')
            reset()
            setUploadedFiles([])
            onSuccess(newPost)
        } catch (err)
        {
            console.error('createPost error:', err)
            toast.error('Failed to create post. Please try again.')
        } finally
        {
            setIsSubmitting(false)
        }
    }

    // ── Handle close ────────────────────────────────────────────────────────

    function handleClose()
    {
        if (isSubmitting) return
        reset()
        setUploadedFiles([])
        onClose()
    }

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <Dialog open onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Caption textarea */}
                    <div className="space-y-1">
                        <Textarea
                            {...register('caption')}
                            placeholder="What's on your mind?"
                            rows={4}
                            className="resize-none"
                            disabled={isSubmitting}
                            aria-label="Post caption"
                        />
                        <div className="flex items-center justify-between">
                            {errors.caption ? (
                                <p className="text-xs text-destructive">{errors.caption.message}</p>
                            ) : (
                                <span />
                            )}
                            <span
                                className={`text-xs tabular-nums ${captionNearLimit
                                        ? captionLength > 2200
                                            ? 'text-destructive font-medium'
                                            : 'text-amber-500'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                {captionLength} / 2200
                            </span>
                        </div>
                    </div>

                    {/* Media uploader */}
                    <MediaUploader
                        onUploadComplete={setUploadedFiles}
                        maxImages={10}
                        maxVideos={1}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                captionLength > 2200
                            }
                        >
                            {isSubmitting ? 'Posting…' : 'Post'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
