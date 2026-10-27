'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/toast'
import { X, Plus, Trash2, Package } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createService } from '@/lib/actions/services'

const schema = z.object({
    title: z.string().min(3, 'At least 3 characters'),
    description: z.string().min(5, 'Add a description').max(2000),
    category: z.string().min(1, 'Select a category'),
    cover_url: z.string().nullable(),
    price: z.coerce.number().min(1, 'Enter a price'),
    condition: z.string().min(1, 'Select condition'),
    brand: z.string().optional(),
    monthly_plan: z.coerce.number().min(0).optional(),
})

type FormValues = z.infer<typeof schema>

const EQUIP_CATEGORIES = [
    'Sewing Machines', 'Generators', 'POS Devices', 'Freezers',
    'Smart TVs', 'Refrigerators', 'Laptops', 'Printers', 'Other Equipment',
]

const CONDITIONS = ['New', 'Used - Good', 'Used - Fair', 'Refurbished']

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"

export default function AddListingModal({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
})
{
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { cover_url: null, condition: '', category: '' },
    })

    const cover = watch('cover_url')

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            const pricingTiers = [{ label: 'Full Price', price: values.price, description: `Condition: ${values.condition}${values.brand ? ` · Brand: ${values.brand}` : ''}` }]
            if (values.monthly_plan && values.monthly_plan > 0)
            {
                pricingTiers.push({ label: 'Monthly Plan', price: values.monthly_plan, description: 'Per month instalment' })
            }
            await createService({
                title: values.title,
                description: values.description + (values.brand ? `\n\nBrand: ${values.brand}` : '') + `\nCondition: ${values.condition}`,
                category: values.category,
                cover_url: values.cover_url,
                pricing_tiers: pricingTiers,
            })
            toast.success('Listing added!')
            reset()
            onOpenChange(false)
            router.refresh()
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to add listing')
        } finally
        {
            setSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => onOpenChange(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">Add Equipment Listing</h2>
                            <p className="text-xs text-gray-400">List equipment for sale or on payment plan</p>
                        </div>
                    </div>
                    <button onClick={() => onOpenChange(false)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
                    {/* Cover image */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Equipment Photo</label>
                        {cover ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={cover} alt="Cover" className="w-full h-40 object-cover" />
                                <button type="button" onClick={() => setValue('cover_url', null)}
                                    className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <MediaUploader maxImages={1} maxVideos={0}
                                onUploadComplete={(files: UploadedFile[]) =>
                                {
                                    if (files[0]) setValue('cover_url', files[0].secure_url)
                                }} />
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                            Item Name <span className="text-rose-500">*</span>
                        </label>
                        <input {...register('title')} placeholder="e.g. Industrial Sewing Machine"
                            className={inputCls} />
                        {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
                    </div>

                    {/* Category + Condition */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <select {...register('category')}
                                    className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors cursor-pointer">
                                    <option value="">Select…</option>
                                    {EQUIP_CATEGORIES.map(c => (
                                        <option key={c} value={c} className="bg-white text-gray-900">{c}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.category && <p className="text-xs text-rose-500">{errors.category.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800">
                                Condition <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <select {...register('condition')}
                                    className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors cursor-pointer">
                                    <option value="">Select…</option>
                                    {CONDITIONS.map(c => (
                                        <option key={c} value={c} className="bg-white text-gray-900">{c}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.condition && <p className="text-xs text-rose-500">{errors.condition.message}</p>}
                        </div>
                    </div>

                    {/* Brand */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Brand (optional)</label>
                        <input {...register('brand')} placeholder="e.g. Singer, Mikano, Casio"
                            className={inputCls} />
                    </div>

                    {/* Price + Monthly plan */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800">
                                Price (₦) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                <input {...register('price')} type="number" min={1} step={500}
                                    placeholder="150000" className={inputCls + " pl-8"} />
                            </div>
                            {errors.price && <p className="text-xs text-rose-500">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800">Monthly Plan (₦)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                <input {...register('monthly_plan')} type="number" min={0} step={500}
                                    placeholder="15000" className={inputCls + " pl-8"} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                            Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea {...register('description')} rows={3}
                            placeholder="Describe the equipment — specs, age, features…"
                            className={inputCls + " resize-none"} />
                        {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={submitting}
                        className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                Publishing…
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Publish Listing
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
