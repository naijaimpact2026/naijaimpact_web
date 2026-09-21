'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Users, Check } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createOrUpdateArtisanProfile } from '@/lib/actions/marketplace'
import type { ServiceCategory } from '@/lib/types'

const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara']

const schema = z.object({
    category_id: z.string().min(1, 'Select a category'),
    title: z.string().min(3, 'At least 3 characters').max(100),
    description: z.string().max(500).optional(),
    price: z.coerce.number().min(0).optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    tags: z.string().optional(),
    is_active: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30'

interface ExistingProfile
{
    id: string
    title: string
    description?: string | null
    category_id?: string | null
    price?: number | null
    state?: string | null
    city?: string | null
    tags?: string[] | null
    is_active?: boolean
    image_urls?: string[]
}

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
    categories: ServiceCategory[]
    existing?: ExistingProfile | null
}

export default function ArtisanProfileModal({ open, onOpenChange, categories, existing }: Props)
{
    const router = useRouter()
    const [portfolioImages, setPortfolioImages] = useState<string[]>(existing?.image_urls ?? [])
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            category_id: existing?.category_id ?? '',
            title: existing?.title ?? '',
            description: existing?.description ?? '',
            price: existing?.price ?? undefined,
            state: existing?.state ?? '',
            city: existing?.city ?? '',
            tags: existing?.tags?.join(', ') ?? '',
            is_active: existing?.is_active ?? true,
        },
    })

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            await createOrUpdateArtisanProfile({
                title: values.title,
                description: values.description,
                category_id: values.category_id,
                price: values.price,
                state: values.state,
                city: values.city,
                tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                is_active: values.is_active,
                images: portfolioImages,
            })
            toast.success(existing ? 'Profile updated!' : 'Artisan profile created!')
            onOpenChange(false)
            router.refresh()
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to save profile')
        } finally
        {
            setSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={() => !submitting && onOpenChange(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card shadow-2xl"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                            <Users className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-foreground">{existing ? 'Edit Artisan Profile' : 'Create Artisan Profile'}</h2>
                            <p className="text-xs text-muted-foreground">Get hired by clients across Nigeria</p>
                        </div>
                    </div>
                    <button onClick={() => !submitting && onOpenChange(false)}
                        className="rounded-xl p-2 transition-colors hover:bg-muted">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
                    {/* Category + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select {...register('category_id')} className={inp + ' cursor-pointer'}>
                                <option value="">Select…</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="mt-1 text-xs text-rose-500">{errors.category_id.message}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">Starting Price (₦)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₦</span>
                                <input {...register('price')} type="number" min={0}
                                    placeholder="5000" className={inp + ' pl-8'} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">
                            Professional Title <span className="text-rose-500">*</span>
                        </label>
                        <input {...register('title')}
                            placeholder="e.g. Professional Tailor & Fashion Designer" className={inp} />
                        {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">Description</label>
                        <textarea {...register('description')} rows={3}
                            placeholder="Describe your skills, experience, and what you offer…"
                            className={inp + ' resize-none'} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">State</label>
                            <select {...register('state')} className={inp + ' cursor-pointer'}>
                                <option value="">Select…</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">City</label>
                            <input {...register('city')} placeholder="e.g. Ikeja" className={inp} />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">Skills / tags</label>
                        <input {...register('tags')} placeholder="e.g. wedding gowns, alterations, embroidery" className={inp} />
                        <p className="mt-1 text-xs text-muted-foreground">Comma-separated</p>
                    </div>

                    {/* Portfolio */}
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">
                            Portfolio Photos (optional)
                        </label>
                        <MediaUploader maxImages={8} maxVideos={0}
                            onUploadComplete={(files: UploadedFile[]) =>
                            {
                                setPortfolioImages(files.map(f => f.secure_url))
                            }} />
                    </div>

                    {/* Available toggle */}
                    <label className="flex cursor-pointer items-center gap-3">
                        <input {...register('is_active')} type="checkbox" className="h-5 w-5 rounded accent-primary" />
                        <span className="text-sm font-semibold text-foreground">Currently available for hire</span>
                    </label>

                    <button type="submit" disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60">
                        {submitting
                            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Saving…</>
                            : <><Check className="h-4 w-4" /> {existing ? 'Update Profile' : 'Create Profile'}</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
