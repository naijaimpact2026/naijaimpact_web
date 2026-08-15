'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Package, Plus, X } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createProduct } from '@/lib/actions/marketplace'

const CATEGORIES = ['Electronics', 'Phones & Tablets', 'Computers', 'Fashion', 'Home & Furniture',
    'Kitchen & Appliances', 'Motors', 'Real Estate', 'Agriculture', 'Livestock',
    'Health & Beauty', 'Building Materials', 'Books', 'Sports', 'Baby & Kids',
    'Services', 'Jobs', 'Events', 'Other']

const CONDITIONS: { value: string; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'used_good', label: 'Used — Good' },
    { value: 'used_fair', label: 'Used — Fair' },
    { value: 'refurbished', label: 'Refurbished' },
]

const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara']

const schema = z.object({
    title: z.string().min(5, 'At least 5 characters').max(150),
    description: z.string().min(10, 'Describe your product').max(5000),
    category: z.string().min(1, 'Select category'),
    subcategory: z.string().optional(),
    price: z.coerce.number().min(100, 'Minimum ₦100'),
    negotiable: z.boolean().default(false),
    condition: z.string().min(1, 'Select condition'),
    brand: z.string().optional(),
    stock_quantity: z.coerce.number().min(1, 'At least 1').default(1),
    location: z.string().optional(),
    state: z.string().optional(),
    warranty: z.string().optional(),
    return_policy: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors'

interface Props
{
    storefronts: { id: string; business_name: string; slug: string }[]
}

export default function CreateProductForm({ storefronts }: Props)
{
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [images, setImages] = useState<string[]>([])
    const [deliveryOptions, setDeliveryOptions] = useState<string[]>(['delivery'])
    const [storefrontId, setStorefrontId] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { negotiable: false, stock_quantity: 1 },
    })

    const toggleDelivery = (opt: string) =>
    {
        setDeliveryOptions(prev =>
            prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
        )
    }

    async function onSubmit(values: FormValues)
    {
        if (images.length === 0)
        {
            toast.error('Please add at least one product image')
            return
        }
        setSubmitting(true)
        try
        {
            const { id } = await createProduct({
                ...values,
                images,
                delivery_options: deliveryOptions,
                storefront_id: storefrontId || undefined,
            })
            toast.success('Product listed successfully!')
            router.push(`/app/market/${id}`)
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to create listing')
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
                    <p className="text-sm font-black text-gray-900">List a Product</p>
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

                    {/* ── STEP 1: Photos & Basic Info ── */}
                    {step === 1 && (
                        <>
                            {/* Photos */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                <p className="font-bold text-gray-900 mb-1">Product Photos</p>
                                <p className="text-xs text-gray-500 mb-4">Add up to 10 photos. First photo is the cover.</p>
                                {images.length > 0 ? (
                                    <div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
                                            {images.map((img, i) => (
                                                <div key={i} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                    {i === 0 && (
                                                        <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full">Cover</span>
                                                    )}
                                                    <button type="button"
                                                        onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {images.length < 10 && (
                                            <MediaUploader maxImages={10 - images.length} maxVideos={0}
                                                onUploadComplete={(files: UploadedFile[]) =>
                                                {
                                                    setImages(prev => [...prev, ...files.map(f => f.secure_url)])
                                                }} />
                                        )}
                                    </div>
                                ) : (
                                    <MediaUploader maxImages={10} maxVideos={0}
                                        onUploadComplete={(files: UploadedFile[]) =>
                                        {
                                            setImages(files.map(f => f.secure_url))
                                        }} />
                                )}
                            </div>

                            {/* Basic info */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Product Details</p>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                        Product Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input {...register('title')} placeholder="e.g. Samsung Galaxy A54 128GB" className={inp} />
                                    {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                            Condition <span className="text-rose-500">*</span>
                                        </label>
                                        <select {...register('condition')} className={inp + ' cursor-pointer'}>
                                            <option value="">Select…</option>
                                            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        {errors.condition && <p className="text-xs text-rose-500 mt-1">{errors.condition.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Brand (optional)</label>
                                    <input {...register('brand')} placeholder="e.g. Samsung, Indomie, Zara" className={inp} />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                        Description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea {...register('description')} rows={4}
                                        placeholder="Describe your product in detail — specs, features, age, reason for selling…"
                                        className={inp + ' resize-none'} />
                                    {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
                                </div>
                            </div>

                            <button type="button" onClick={() => setStep(2)}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* ── STEP 2: Pricing & Location ── */}
                    {step === 2 && (
                        <>
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Pricing & Stock</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                            Price (₦) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                                            <input {...register('price')} type="number" min={100} step={100}
                                                placeholder="25000" className={inp + ' pl-8'} />
                                        </div>
                                        {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Quantity</label>
                                        <input {...register('stock_quantity')} type="number" min={1} className={inp} />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input {...register('negotiable')} type="checkbox" className="w-5 h-5 accent-green-600 rounded" />
                                    <span className="text-sm font-semibold text-gray-800">Price is negotiable</span>
                                </label>
                            </div>

                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Location & Delivery</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800 mb-1.5 block">City / Area</label>
                                        <input {...register('location')} placeholder="e.g. Ikeja, Lagos" className={inp} />
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
                                    <label className="text-sm font-semibold text-gray-800 mb-2 block">Delivery Options</label>
                                    <div className="flex gap-3">
                                        {['delivery', 'pickup'].map(opt => (
                                            <button key={opt} type="button"
                                                onClick={() => toggleDelivery(opt)}
                                                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all capitalize ${deliveryOptions.includes(opt) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Storefront */}
                            {storefronts.length > 0 && (
                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                    <p className="font-bold text-gray-900 mb-1">Add to Storefront (optional)</p>
                                    <select
                                        value={storefrontId}
                                        onChange={e => setStorefrontId(e.target.value)}
                                        className={inp + ' mt-2 cursor-pointer'}>
                                        <option value="">None</option>
                                        {storefronts.map(sf => (
                                            <option key={sf.id} value={sf.id}>{sf.business_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button type="button" onClick={() => setStep(3)}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* ── STEP 3: Review & Publish ── */}
                    {step === 3 && (
                        <>
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                                <p className="font-bold text-gray-900">Policies (optional)</p>
                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Warranty</label>
                                    <input {...register('warranty')} placeholder="e.g. 6 months seller warranty" className={inp} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Return Policy</label>
                                    <input {...register('return_policy')} placeholder="e.g. Returns accepted within 7 days" className={inp} />
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-3xl p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">✅</span>
                                    <p className="font-bold text-gray-900">Ready to Publish!</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Your product will be visible to thousands of buyers across Nigeria with escrow-protected payments.
                                </p>
                                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                    <span>📸 {images.length} photo{images.length !== 1 ? 's' : ''}</span>
                                    <span>🚚 {deliveryOptions.join(', ')}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                {submitting
                                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Publishing…</>
                                    : <><Plus className="w-4 h-4" /> Publish Product</>}
                            </button>
                        </>
                    )}

                    <div className="h-4" />
                </div>
            </form>
        </div>
    )
}
