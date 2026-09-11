'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Store } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createStorefront } from '@/lib/actions/marketplace'

const CATEGORIES = ['Fashion', 'Electronics', 'Food & Catering', 'Home & Furniture', 'Beauty',
    'Agricultural', 'Building & Construction', 'Auto Parts', 'Books', 'Kids & Baby', 'Other']

const schema = z.object({
    business_name: z.string().min(2, 'At least 2 characters').max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
    tagline: z.string().max(120).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().min(1, 'Select category'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    return_policy: z.string().max(500).optional(),
    shipping_policy: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors'

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
}

export default function CreateStorefrontModal({ open, onOpenChange }: Props)
{
    const router = useRouter()
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { category: '' },
    })

    const businessName = watch('business_name', '')

    function autoSlug(name: string)
    {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
    }

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            const { id } = await createStorefront({
                ...values,
                logo_url: logoUrl ?? undefined,
                cover_url: coverUrl ?? undefined,
            })
            toast.success('Store created!')
            onOpenChange(false)
            router.push(`/app/market/stores/${values.slug}`)
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to create store')
            setSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => !submitting && onOpenChange(false)}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Store className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">Create Your Storefront</h2>
                            <p className="text-xs text-gray-400">Your mini online store on NaijaMarket</p>
                        </div>
                    </div>
                    <button onClick={() => !submitting && onOpenChange(false)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
                    {/* Cover photo */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Store Cover Photo</label>
                        {coverUrl ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-32">
                                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setCoverUrl(null)}
                                    className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <MediaUploader maxImages={1} maxVideos={0}
                                onUploadComplete={(files: UploadedFile[]) => { if (files[0]) setCoverUrl(files[0].secure_url) }} />
                        )}
                    </div>

                    {/* Logo */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Store Logo</label>
                        {logoUrl ? (
                            <div className="flex items-center gap-3">
                                <img src={logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-gray-200" />
                                <button type="button" onClick={() => setLogoUrl(null)}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <MediaUploader maxImages={1} maxVideos={0}
                                onUploadComplete={(files: UploadedFile[]) => { if (files[0]) setLogoUrl(files[0].secure_url) }} />
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                            Business Name <span className="text-rose-500">*</span>
                        </label>
                        <input {...register('business_name')}
                            onChange={e =>
                            {
                                register('business_name').onChange(e)
                                setValue('slug', autoSlug(e.target.value))
                            }}
                            placeholder="e.g. Mama Cynthia's Fabrics" className={inp} />
                        {errors.business_name && <p className="text-xs text-rose-500 mt-1">{errors.business_name.message}</p>}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                            Store URL <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 shrink-0">/market/stores/</span>
                            <input {...register('slug')} placeholder="mama-cynthias-fabrics" className={inp} />
                        </div>
                        {errors.slug && <p className="text-xs text-rose-500 mt-1">{errors.slug.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select {...register('category')} className={inp + ' cursor-pointer'}>
                                <option value="">Select…</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
                        </div>
                        {/* Phone */}
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Phone</label>
                            <input {...register('phone')} placeholder="080 0000 0000" className={inp} />
                        </div>
                    </div>

                    {/* Tagline */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Tagline</label>
                        <input {...register('tagline')} placeholder="e.g. Quality fabrics at affordable prices" className={inp} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Description</label>
                        <textarea {...register('description')} rows={3}
                            placeholder="Tell customers about your business…"
                            className={inp + ' resize-none'} />
                    </div>

                    <button type="submit" disabled={submitting}
                        className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        {submitting
                            ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Creating…</>
                            : <><Store className="w-4 h-4" /> Open My Store</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
