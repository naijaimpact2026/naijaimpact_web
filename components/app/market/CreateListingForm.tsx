'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Camera, Tag } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createListing } from '@/lib/actions/marketplace'
import type { NmListingType, NmListingCondition, NmDeliveryOption, ServiceCategory } from '@/lib/types'

const LISTING_TYPES: { value: NmListingType; label: string }[] = [
    { value: 'product', label: 'Product for Sale' },
    { value: 'service', label: 'Service / Artisan' },
    { value: 'rental', label: 'Rental' },
    { value: 'auction', label: 'Auction' },
]

const CONDITIONS: { value: NmListingCondition; label: string }[] = [
    { value: 'new', label: 'Brand New' },
    { value: 'fairly_used', label: 'Fairly Used' },
    { value: 'used', label: 'Used' },
]

const DELIVERY_OPTIONS: { value: NmDeliveryOption; label: string }[] = [
    { value: 'pickup', label: 'Pickup Only' },
    { value: 'local_delivery', label: 'Local Delivery' },
    { value: 'nationwide', label: 'Nationwide Delivery' },
    { value: 'none', label: 'Not Applicable' },
]

const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara']

const schema = z.object({
    title: z.string().min(5, 'At least 5 characters').max(150),
    description: z.string().min(10, 'Add a description').max(5000),
    listing_type: z.string().min(1, 'Select type'),
    condition: z.string().optional(),
    category_id: z.string().optional(),
    price: z.coerce.number().min(100, 'Minimum ₦100'),
    negotiable: z.boolean().default(false),
    stock: z.coerce.number().min(1).default(1),
    state: z.string().optional(),
    city: z.string().optional(),
    delivery_option: z.string().min(1, 'Select delivery option'),
    delivery_fee: z.coerce.number().min(0).default(0),
    brand: z.string().optional(),
    warranty_days: z.coerce.number().min(0).default(0),
    escrow_enabled: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors'

interface Props
{
    categories: ServiceCategory[]
}

export default function CreateListingForm({ categories }: Props)
{
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [images, setImages] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])

    const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            listing_type: 'product',
            negotiable: false,
            stock: 1,
            delivery_option: 'pickup',
            delivery_fee: 0,
            warranty_days: 0,
            escrow_enabled: true,
        },
    })

    const listingType = watch('listing_type')
    const deliveryOption = watch('delivery_option')

    function addTag(e: React.KeyboardEvent)
    {
        if (e.key === 'Enter' && tagInput.trim())
        {
            e.preventDefault()
            const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
            if (!tags.includes(tag) && tags.length < 10)
            {
                setTags(prev => [...prev, tag])
            }
            setTagInput('')
        }
    }

    async function onSubmit(values: FormValues)
    {
        if (images.length === 0)
        {
            toast.error('Please add at least one photo')
            return
        }
        setSubmitting(true)
        try
        {
            const { id } = await createListing({
                title: values.title,
                description: values.description,
                listing_type: values.listing_type as NmListingType,
                condition: values.condition as NmListingCondition | undefined,
                category_id: values.category_id || undefined,
                price: values.price,
                negotiable: values.negotiable,
                stock: values.stock,
                state: values.state,
                city: values.city,
                delivery_option: values.delivery_option as NmDeliveryOption,
                delivery_fee: values.delivery_fee,
                brand: values.brand,
                warranty_days: values.warranty_days,
                tags,
                images,
                escrow_enabled: values.escrow_enabled,
            })
            toast.success('Listing published!')
            router.push(`/app/market/${id}`)
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to publish listing')
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Header */}
            <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <div className="flex-1">
                    <p className="text-sm font-black text-gray-900">Create Listing</p>
                    <div className="flex gap-1.5 mt-1.5">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1 rounded-full flex-1 transition-colors ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
                <span className="text-xs font-bold text-gray-500">Step {step}/3</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

                    {/* ── Step 1: Photos + Details ── */}
                    {step === 1 && (
                        <>
                            {/* Photos */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                <p className="font-bold text-gray-900 mb-1">Photos</p>
                                <p className="text-xs text-gray-500 mb-4">Add up to 10 photos. First photo is the cover.</p>
                                {images.length > 0 ? (
                                    <div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
                                            {images.map((img, i) => (
                                                <div key={i} className="shrink-0 relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                    {i === 0 && <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-green-600 text-white px-1 py-0.5 rounded">Cover</span>}
                                                    <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                                                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {images.length < 10 && (
                                            <MediaUploader maxImages={10 - images.length} maxVideos={0}
                                                onUploadComplete={(files: UploadedFile[]) => setImages(prev => [...prev, ...files.map(f => f.secure_url)])} />
                                        )}
                                    </div>
                                ) : (
                                    <MediaUploader maxImages={10} maxVideos={0}
                                        onUploadComplete={(files: UploadedFile[]) => setImages(files.map(f => f.secure_url))} />
                                )}
                            </div>

                            {/* Basic info */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Listing Details</p>

                                {/* Listing type */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-2 block">Listing Type <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {LISTING_TYPES.map(t => (
                                            <label key={t.value}
                                                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all ${listingType === t.value ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                                <input {...register('listing_type')} type="radio" value={t.value} className="sr-only" />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Title <span className="text-rose-500">*</span></label>
                                    <input {...register('title')} placeholder="What are you selling?" className={inp} />
                                    {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
                                </div>

                                {/* Category + Condition */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Category</label>
                                        <select {...register('category_id')} className={inp + ' cursor-pointer'}>
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {listingType === 'product' && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Condition</label>
                                            <select {...register('condition')} className={inp + ' cursor-pointer'}>
                                                <option value="">Select…</option>
                                                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Description <span className="text-rose-500">*</span></label>
                                    <textarea {...register('description')} rows={4}
                                        placeholder="Describe your item — specs, features, reason for selling…"
                                        className={inp + ' resize-none'} />
                                    {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Brand (optional)</label>
                                    <input {...register('brand')} placeholder="e.g. Samsung, Nike, Toyota" className={inp} />
                                </div>
                            </div>

                            <button type="button" onClick={() => setStep(2)}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* ── Step 2: Pricing + Location ── */}
                    {step === 2 && (
                        <>
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Pricing</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Price (₦) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                            <input {...register('price')} type="number" min={100} step={100}
                                                placeholder="25000" className={inp + ' pl-8'} />
                                        </div>
                                        {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                            {listingType === 'product' ? 'Quantity' : 'Slots available'}
                                        </label>
                                        <input {...register('stock')} type="number" min={1} className={inp} />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input {...register('negotiable')} type="checkbox" className="w-5 h-5 accent-green-600 rounded" />
                                    <span className="text-sm font-semibold text-gray-800">Price is negotiable</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input {...register('escrow_enabled')} type="checkbox" className="w-5 h-5 accent-green-600 rounded" />
                                    <span className="text-sm font-semibold text-gray-800">Enable escrow protection</span>
                                </label>
                            </div>

                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Location & Delivery</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">City</label>
                                        <input {...register('city')} placeholder="e.g. Ikeja" className={inp} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">State</label>
                                        <select {...register('state')} className={inp + ' cursor-pointer'}>
                                            <option value="">Select…</option>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-2 block">Delivery Option <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {DELIVERY_OPTIONS.map(opt => (
                                            <label key={opt.value}
                                                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold cursor-pointer transition-all ${deliveryOption === opt.value ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                                <input {...register('delivery_option')} type="radio" value={opt.value} className="sr-only" />
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {deliveryOption !== 'pickup' && deliveryOption !== 'none' && (
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Delivery Fee (₦)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                            <input {...register('delivery_fee')} type="number" min={0} step={100} className={inp + ' pl-8'} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="button" onClick={() => setStep(3)}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* ── Step 3: Tags + Warranty + Publish ── */}
                    {step === 3 && (
                        <>
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Final Details</p>

                                {listingType === 'product' && (
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Warranty Days</label>
                                        <input {...register('warranty_days')} type="number" min={0}
                                            placeholder="e.g. 30, 90, 365 (0 = no warranty)" className={inp} />
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Tags (press Enter to add)</label>
                                    <input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={addTag}
                                        placeholder="e.g. electronics, phones, samsung"
                                        className={inp}
                                    />
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {tags.map(tag => (
                                                <span key={tag}
                                                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                                    #{tag}
                                                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-3xl p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <p className="font-bold text-gray-900">Ready to Publish!</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Your listing will be visible to buyers across Nigeria with escrow-protected payments.
                                </p>
                                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> {images.length} photo{images.length !== 1 ? 's' : ''}</span>
                                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {tags.length} tag{tags.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                {submitting
                                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Publishing…</>
                                    : <><Plus className="w-4 h-4" /> Publish Listing</>}
                            </button>
                        </>
                    )}

                    <div className="h-4" />
                </div>
            </form>
        </div>
    )
}
