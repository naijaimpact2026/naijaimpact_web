'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/toast'
import { X, Store } from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createStorefront } from '@/lib/actions/marketplace'

const schema = z.object({
    business_name: z.string().min(2, 'At least 2 characters').max(100),
    bio: z.string().max(500).optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inp = 'w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30'

interface Props
{
    open: boolean
    onOpenChange: (v: boolean) => void
}

export default function CreateStorefrontModal({ open, onOpenChange }: Props)
{
    const router = useRouter()
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    async function onSubmit(values: FormValues)
    {
        setSubmitting(true)
        try
        {
            const { id } = await createStorefront({
                ...values,
                logo_url: logoUrl ?? undefined,
            })
            toast.success('Store created!')
            onOpenChange(false)
            router.push(`/app/market/stores/${id}`)
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to create store')
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
                            <Store className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-foreground">Create Your Storefront</h2>
                            <p className="text-xs text-muted-foreground">Your mini online store on Hubnovo Marketplace</p>
                        </div>
                    </div>
                    <button onClick={() => !submitting && onOpenChange(false)}
                        className="rounded-xl p-2 transition-colors hover:bg-muted">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
                    {/* Logo */}
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">Store Logo</label>
                        {logoUrl ? (
                            <div className="flex items-center gap-3">
                                <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl border border-border object-cover" />
                                <button type="button" onClick={() => setLogoUrl(null)}
                                    className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100">
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
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">
                            Business Name <span className="text-rose-500">*</span>
                        </label>
                        <input {...register('business_name')}
                            placeholder="e.g. Mama Cynthia's Fabrics" className={inp} />
                        {errors.business_name && <p className="mt-1 text-xs text-rose-500">{errors.business_name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">State</label>
                            <input {...register('state')} placeholder="e.g. Lagos" className={inp} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-foreground">Phone</label>
                            <input {...register('phone')} placeholder="080 0000 0000" className={inp} />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">City</label>
                        <input {...register('city')} placeholder="e.g. Ikeja" className={inp} />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">About your store</label>
                        <textarea {...register('bio')} rows={3}
                            placeholder="Tell customers about your business…"
                            className={inp + ' resize-none'} />
                    </div>

                    <button type="submit" disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60">
                        {submitting
                            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Creating…</>
                            : <><Store className="h-4 w-4" /> Open My Store</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
