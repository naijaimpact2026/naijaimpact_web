'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import
{
    Image as ImageIcon, FileText, BarChart2, Calendar, HandCoins, MapPin,
    Globe2, Users, Lock, Info, ChevronRight, CalendarClock,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createPost } from '@/lib/actions/posts'
import type { User } from '@/lib/types'

const MAX_LEN = 5000

const schema = z.object({
    caption: z.string().max(MAX_LEN, `Caption must be ${MAX_LEN} characters or less`).optional().default(''),
})
type FormValues = z.infer<typeof schema>

// Only Photo/Video is actually implemented — the rest are shown to match the
// design but are inert, same honesty rule as the feed composer bar.
const COMPOSER_ACTIONS = [
    { icon: ImageIcon, label: 'Photo/Video', functional: true },
    { icon: FileText, label: 'Document', functional: false },
    { icon: BarChart2, label: 'Poll', functional: false },
    { icon: Calendar, label: 'Event', functional: false },
    { icon: HandCoins, label: 'Opportunity', functional: false },
    { icon: MapPin, label: 'Location', functional: false },
]

const AUDIENCE_OPTIONS = [
    { key: 'public', icon: Globe2, label: 'Public', desc: 'Anyone on Hubnovo', enabled: true },
    { key: 'connections', icon: Users, label: 'My Connections', desc: 'Only people you follow or are connected with', enabled: false },
    { key: 'group', icon: Users, label: 'Group', desc: 'Post to a group', enabled: false },
    { key: 'only-me', icon: Lock, label: 'Only Me', desc: 'Visible only to you', enabled: false },
]

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

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { caption: '' },
    })

    const caption = watch('caption') ?? ''

    async function onSubmit(values: FormValues)
    {
        if (isSubmitting) return
        const captionValue = values.caption ?? ''

        if (!captionValue.trim() && uploadedFiles.length === 0)
        {
            toast.error('Add a caption or media before posting.')
            return
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
            await createPost(captionValue, type, mediaUrls)
            toast.success('Post created!')
            router.push('/app/feed')
        } catch (err)
        {
            console.error('createPost error:', err)
            toast.error('Failed to create post. Please try again.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="font-display text-2xl font-extrabold text-secondary mb-5">Create Post</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-6 items-start">
                {/* Main composer */}
                <div className="flex-1 min-w-0 rounded-2xl bg-card border border-border shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                            <AvatarImage src={user?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                {getInitials(user?.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{user?.display_name ?? 'You'}</p>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-0.5">
                                <Globe2 className="w-3 h-3" /> Public
                            </span>
                        </div>
                    </div>

                    <Textarea
                        {...register('caption')}
                        placeholder="What's on your mind?"
                        rows={6}
                        className="resize-none border-border"
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

                    {/* Composer action row — Photo/Video is the real, always-visible feature below;
                        the rest are shown to match the design but marked inert. */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border flex-wrap">
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

                    <div className="mt-3">
                        <MediaUploader onUploadComplete={setUploadedFiles} maxImages={10} maxVideos={1} />
                    </div>

                    {/* Add to a Group — no groups table yet */}
                    <div className="mt-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" /> Add to a Group <span className="font-normal text-muted-foreground">(Optional)</span>
                        </label>
                        <select disabled className="w-full text-sm rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground cursor-not-allowed" title="Coming soon">
                            <option>Select a group — coming soon</option>
                        </select>
                    </div>

                    {/* Tag People — not implemented */}
                    <div className="mt-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Tag People <span className="font-normal text-muted-foreground">(Optional)</span>
                        </label>
                        <input
                            disabled
                            placeholder="Search and tag people — coming soon"
                            title="Coming soon"
                            className="w-full text-sm rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground cursor-not-allowed placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-5">
                        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                            <Link href="/app/feed">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting || caption.length > MAX_LEN}>
                            {isSubmitting ? 'Posting…' : 'Post'}
                        </Button>
                    </div>
                </div>

                {/* Right rail */}
                <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
                    {/* Post Audience — only Public actually works */}
                    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                        <h3 className="font-bold text-sm text-foreground mb-0.5">Post Audience</h3>
                        <p className="text-[11px] text-muted-foreground mb-3">Choose who can see your post</p>
                        <div className="space-y-3">
                            {AUDIENCE_OPTIONS.map((a) => (
                                <label
                                    key={a.key}
                                    className={`flex items-start gap-2.5 ${a.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                    title={a.enabled ? undefined : 'Coming soon'}
                                >
                                    <input
                                        type="radio"
                                        name="audience"
                                        defaultChecked={a.key === 'public'}
                                        disabled={!a.enabled}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <a.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{a.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-snug">{a.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* More Options — not backed by any post columns yet */}
                    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                        <h3 className="font-bold text-sm text-foreground mb-3">More Options</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Allow comments', on: true },
                                { label: 'Allow sharing', on: true },
                                { label: 'Feature this post', on: false },
                            ].map((opt) => (
                                <div key={opt.label} className="flex items-center justify-between" title="Not yet configurable">
                                    <span className="text-xs font-medium text-foreground/70">{opt.label}</span>
                                    <span className={`w-8 h-[18px] rounded-full relative shrink-0 ${opt.on ? 'bg-primary/30' : 'bg-muted'}`}>
                                        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${opt.on ? 'left-4' : 'left-0.5'}`} />
                                    </span>
                                </div>
                            ))}
                            <button type="button" disabled title="Coming soon" className="flex items-center justify-between w-full pt-1 text-muted-foreground/50 cursor-not-allowed">
                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                    <CalendarClock className="w-3.5 h-3.5" /> Schedule post
                                </span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
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
