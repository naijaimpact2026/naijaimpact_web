'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/toast'
import { ChevronLeft, Check, Camera, Tag, X } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { updateListing } from '@/lib/actions/marketplace'
import type { NmListingDetail, NmListingType, NmListingCondition, NmDeliveryOption, ServiceCategory } from '@/lib/types'

const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara']

const schema = z.object({
    title: z.string().min(3, 'At least 3 characters').max(150),
    description: z.string().min(5, 'Add a description').max(5000),
    category_id: z.string().optional(),
    price: z.coerce.number().min(0, 'Must be positive'),
    negotiable: z.boolean().default(false),
    stock: z.coerce.number().min(1).default(1),
    state: z.string().optional(),
    city: z.string().optional(),
    delivery_option: z.string().optional(),
    delivery_fee: z.coerce.number().min(0).default(0),
    brand: z.string().optional(),
    warranty_days: z.coerce.number().min(0).default(0),
    escrow_enabled: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors'

interface Props
{
    listing: NmListingDetail
    categories: ServiceCategory[]
}

export default function EditListingClient({ listing, categories }: Props)
{
    const router = useRouter()
    const [images, setImages] = useState<string[]>(
        listing.image_urls?.length ? listing.image_urls : (listing.cover_image_url ? [listing.cover_image_url] : [])
    )
    const [submitting, setSubmitting] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>(listing.tags || [])

    const isService = listing.listing_type === 'service'

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: listing.title || '',
            description: listing.description || '',
            category_id: listing.category_id || '',
            price: listing.price ?? 0,
            negotiable: listing.negotiable ?? false,
            stock: listing.stock ?? 1,
            state: listing.state || '',
            city: listing.city || '',
            delivery_option: listing.delivery_option || 'pickup',
            delivery_fee: listing.delivery_fee ?? 0,
            brand: listing.brand || '',
            warranty_days: listing.warranty_days ?? 0,
            escrow_enabled: listing.escrow_enabled ?? true,
        },
    })

    function addTag(e: React.KeyboardEvent)
    {
        if (e.key === 'Enter' && tagInput.trim())
        {
            e.preventDefault()
            const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
            if (!tags.includes(tag) && tags.length < 10)
            {
                setTags(prev => [...prev, tag])
                setTagInput('')
            }
        }
    }

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            await updateListing(listing.id, {
                title: values.title,
                description: values.description,
                category_id: values.category_id || undefined,
                price: values.price,
                negotiable: values.negotiable,
                stock: values.stock,
                state: values.state || undefined,
                city: values.city || undefined,
                delivery_option: values.delivery_option as NmDeliveryOption | undefined,
                delivery_fee: values.delivery_fee,
                brand: values.brand || undefined,
                warranty_days: values.warranty_days,
                escrow_enabled: values.escrow_enabled,
                tags,
                images,
            })
            toast.success('Listing updated!')
            const dest = isService ? `/app/market/artisans/${listing.id}` : `/app/market/${listing.id}`
            router.push(dest)
            router.refresh()
        }
        catch (err: any)
        {
            toast.error(err?.message || 'Failed to update listing')
        }
        finally
        {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
            {/* Top header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-foreground">
                        Edit {isService ? 'Service' : 'Listing'}
                    </h1>
                    <p className="text-xs text-muted-foreground">Update your details and availability</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Images */}
                <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
                    <label className="text-sm font-bold text-foreground mb-1 block">Photos</label>
                    <p className="text-xs text-muted-foreground mb-3">Upload portfolio photos or product images.</p>

                    {images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                            {images.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-border">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    {i === 0 && <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-primary text-primary-foreground px-1 py-0.5 rounded">Cover</span>}
                                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <MediaUploader
                        maxImages={6}
                        maxVideos={0}
                        onUploadComplete={(files: UploadedFile[]) => {
                            setImages(prev => [...prev, ...files.map(f => f.secure_url)])
                        }}
                    />
                </div>

                {/* Details */}
                <div className="bg-card rounded-3xl p-5 shadow-sm border border-border space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Title <span className="text-rose-500">*</span></label>
                        <input {...register('title')} className={inp} placeholder="Service or listing title" />
                        {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Category</label>
                        <select {...register('category_id')} className={inp + ' cursor-pointer'}>
                            <option value="">Select category…</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">Price (₦) <span className="text-rose-500">*</span></label>
                            <input {...register('price')} type="number" min={0} className={inp} />
                            {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
                        </div>
                        {!isService && (
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1.5 block">Quantity</label>
                                <input {...register('stock')} type="number" min={1} className={inp} />
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input {...register('negotiable')} type="checkbox" className="w-5 h-5 accent-primary rounded" />
                        <span className="text-sm font-semibold text-foreground">Price is negotiable</span>
                    </label>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Description <span className="text-rose-500">*</span></label>
                        <textarea {...register('description')} rows={4} className={inp + ' resize-none'} />
                        {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
                    </div>
                </div>

                {/* Location */}
                <div className="bg-card rounded-3xl p-5 shadow-sm border border-border space-y-4">
                    <p className="font-bold text-foreground">Location</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">City</label>
                            <input {...register('city')} placeholder="e.g. Ikeja" className={inp} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">State</label>
                            <select {...register('state')} className={inp + ' cursor-pointer'}>
                                <option value="">Select state…</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Tags (press Enter)</label>
                        <input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                            placeholder="Add tags: repair, mobile, emergency…"
                            className={inp}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
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

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl text-sm font-black text-primary-foreground bg-primary flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60 shadow-lg hover:bg-primary/90"
                >
                    {submitting
                        ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
                        : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
            </form>
        </div>
    )
}
