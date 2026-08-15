'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Users } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createOrUpdateArtisanProfile } from '@/lib/actions/marketplace'
import type { ArtisanCategory } from '@/lib/types'

const CATEGORIES: ArtisanCategory[] = [
    'fashion', 'carpentry', 'electrical', 'plumbing', 'mechanics', 'painting',
    'catering', 'events', 'photography', 'design', 'beauty', 'cleaning',
    'solar', 'construction', 'technology', 'other',
]

const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara']

const schema = z.object({
    category: z.string().min(1, 'Select a category'),
    profession_title: z.string().min(3, 'At least 3 characters').max(100),
    bio: z.string().max(500).optional(),
    pricing_from: z.coerce.number().min(0).optional(),
    years_experience: z.coerce.number().min(0).max(60).optional(),
    available: z.boolean().default(true),
    response_time: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors'

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
    existing?: { id: string; category: string; profession_title: string; available: boolean } | null
}

export default function ArtisanProfileModal({ open, onOpenChange, existing }: Props)
{
    const router = useRouter()
    const [portfolioImages, setPortfolioImages] = useState<string[]>([])
    const [serviceAreas, setServiceAreas] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            category: existing?.category ?? '',
            profession_title: existing?.profession_title ?? '',
            available: existing?.available ?? true,
        },
    })

    function toggleArea(state: string)
    {
        setServiceAreas(prev =>
            prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
        )
    }

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            await createOrUpdateArtisanProfile({
                category: values.category as ArtisanCategory,
                profession_title: values.profession_title,
                bio: values.bio,
                portfolio_images: portfolioImages,
                pricing_from: values.pricing_from,
                available: values.available,
                response_time: values.response_time,
                years_experience: values.years_experience,
                service_areas: serviceAreas,
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => !submitting && onOpenChange(false)}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">{existing ? 'Edit Artisan Profile' : 'Create Artisan Profile'}</h2>
                            <p className="text-xs text-gray-400">Get hired by clients across Nigeria</p>
                        </div>
                    </div>
                    <button onClick={() => !submitting && onOpenChange(false)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
                    {/* Category + Title */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select {...register('category')} className={inp + ' cursor-pointer capitalize'}>
                                <option value="">Select…</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c} className="capitalize">{c}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                Experience (years)
                            </label>
                            <input {...register('years_experience')} type="number" min={0} max={60}
                                placeholder="5" className={inp} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                            Professional Title <span className="text-rose-500">*</span>
                        </label>
                        <input {...register('profession_title')}
                            placeholder="e.g. Professional Tailor & Fashion Designer" className={inp} />
                        {errors.profession_title && <p className="text-xs text-rose-500 mt-1">{errors.profession_title.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Bio</label>
                        <textarea {...register('bio')} rows={3}
                            placeholder="Describe your skills, experience, and what you offer…"
                            className={inp + ' resize-none'} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Starting Price (₦)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                <input {...register('pricing_from')} type="number" min={0}
                                    placeholder="5000" className={inp + ' pl-8'} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Response Time</label>
                            <input {...register('response_time')} placeholder="e.g. Within 2 hours" className={inp} />
                        </div>
                    </div>

                    {/* Service areas */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-2 block">Service Areas (states)</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {STATES.map(state => (
                                <button key={state} type="button" onClick={() => toggleArea(state)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${serviceAreas.includes(state) ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}>
                                    {state}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div>
                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                            Portfolio Photos (optional)
                        </label>
                        <MediaUploader maxImages={8} maxVideos={0}
                            onUploadComplete={(files: UploadedFile[]) =>
                            {
                                setPortfolioImages(files.map(f => f.secure_url))
                            }} />
                    </div>

                    {/* Available toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input {...register('available')} type="checkbox" className="w-5 h-5 accent-green-600 rounded" />
                        <span className="text-sm font-semibold text-gray-800">Currently available for hire</span>
                    </label>

                    <button type="submit" disabled={submitting}
                        className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        {submitting
                            ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
                            : existing ? '✓ Update Profile' : '✓ Create Profile'}
                    </button>
                </form>
            </div>
        </div>
    )
}
