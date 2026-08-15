'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { updateService } from '@/lib/actions/services'
import type { ServiceWithProvider } from '@/lib/types'

// ─── Zod schema (mirrors create form) ─────────────────────────────────────────

const pricingTierSchema = z.object({
    label: z
        .string()
        .min(1, 'Tier name is required')
        .max(50, 'Tier name must be 50 characters or fewer'),
    price: z.coerce
        .number({ invalid_type_error: 'Price must be a number' })
        .min(1, 'Price must be at least ₦1'),
    description: z
        .string()
        .max(200, 'Description must be 200 characters or fewer')
        .optional()
        .or(z.literal('')),
})

const serviceSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be 100 characters or fewer'),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(5000, 'Description must be 5000 characters or fewer'),
    category: z.enum(
        ['Tech', 'Design', 'Writing', 'Marketing', 'Finance', 'Health', 'Education', 'Legal', 'Other'],
        { required_error: 'Select a category' }
    ),
    cover_url: z.string().nullable(),
    pricing_tiers: z.array(pricingTierSchema).min(1, 'Add at least one pricing tier'),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

const CATEGORIES = [
    'Tech',
    'Design',
    'Writing',
    'Marketing',
    'Finance',
    'Health',
    'Education',
    'Legal',
    'Other',
] as const

// ─── Component ─────────────────────────────────────────────────────────────────

interface EditServiceFormProps
{
    service: ServiceWithProvider & {
        provider_bio: string | null
        provider_profession: string | null
        provider_verified: boolean
        provider_id: string
    }
}

export default function EditServiceForm({ service }: EditServiceFormProps)
{
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            title: service.title,
            description: service.description ?? '',
            category: service.category as ServiceFormValues['category'],
            cover_url: service.cover_url,
            pricing_tiers:
                service.pricing_tiers.length > 0
                    ? service.pricing_tiers.map((t) => ({
                        label: t.label,
                        price: t.price,
                        description: t.description ?? '',
                    }))
                    : [{ label: '', price: 0, description: '' }],
        },
    })

    const {
        register,
        control,
        formState: { errors },
        watch,
        setValue,
        handleSubmit,
    } = form

    const { fields, append, remove } = useFieldArray({ control, name: 'pricing_tiers' })

    const coverUrl = watch('cover_url')

    async function onSubmit(values: ServiceFormValues)
    {
        setIsSubmitting(true)
        try
        {
            await updateService(service.id, {
                title: values.title,
                description: values.description,
                category: values.category,
                cover_url: values.cover_url,
                pricing_tiers: values.pricing_tiers.map((t) => ({
                    label: t.label,
                    price: Number(t.price),
                    description: t.description ?? '',
                })),
            })
            toast.success('Service updated successfully!')
            router.push(`/app/services/${service.id}`)
        } catch (err)
        {
            const msg = err instanceof Error ? err.message : 'Failed to update service'
            toast.error(msg)
        } finally
        {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bento-card noise-bg p-6 space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
                <Label htmlFor="title">
                    Service Title <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="title"
                    placeholder="e.g. Professional Logo Design"
                    {...register('title')}
                    aria-invalid={!!errors.title}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="description"
                    rows={5}
                    placeholder="Describe your service in detail…"
                    {...register('description')}
                    aria-invalid={!!errors.description}
                />
                {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                </Label>
                <select
                    id="category"
                    {...register('category')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            {/* Cover image */}
            <div className="space-y-1.5">
                <Label>Cover Image</Label>
                {coverUrl ? (
                    <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={coverUrl}
                            alt="Cover preview"
                            className="rounded-xl object-cover h-40 w-full"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => setValue('cover_url', null)}
                        >
                            Remove
                        </Button>
                    </div>
                ) : (
                    <MediaUploader
                        maxImages={1}
                        maxVideos={0}
                        onUploadComplete={(files: UploadedFile[]) =>
                        {
                            const file = files[0]
                            if (file) setValue('cover_url', file.secure_url)
                        }}
                    />
                )}
            </div>

            {/* Pricing tiers */}
            <div className="space-y-3">
                <Label>
                    Pricing Tiers <span className="text-destructive">*</span>
                </Label>

                <div className="space-y-3">
                    {fields.map((field, idx) =>
                    {
                        const tierErrors = errors.pricing_tiers?.[idx]
                        return (
                            <div key={field.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Tier {idx + 1}</span>
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => remove(idx)}
                                            aria-label={`Remove tier ${idx + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor={`tier-${idx}-label`}>
                                            Tier Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id={`tier-${idx}-label`}
                                            placeholder="e.g. Basic"
                                            {...register(`pricing_tiers.${idx}.label`)}
                                            aria-invalid={!!tierErrors?.label}
                                        />
                                        {tierErrors?.label && (
                                            <p className="text-xs text-destructive">{tierErrors.label.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor={`tier-${idx}-price`}>
                                            Price (₦) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id={`tier-${idx}-price`}
                                            type="number"
                                            min={1}
                                            step={100}
                                            placeholder="5000"
                                            {...register(`pricing_tiers.${idx}.price`)}
                                            aria-invalid={!!tierErrors?.price}
                                        />
                                        {tierErrors?.price && (
                                            <p className="text-xs text-destructive">{tierErrors.price.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor={`tier-${idx}-description`}>What&apos;s included (optional)</Label>
                                    <Textarea
                                        id={`tier-${idx}-description`}
                                        rows={2}
                                        placeholder="e.g. 2 revisions, source files, delivery in 3 days"
                                        {...register(`pricing_tiers.${idx}.description`)}
                                    />
                                    {tierErrors?.description && (
                                        <p className="text-xs text-destructive">{tierErrors.description.message}</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {(errors.pricing_tiers as any)?.message && (
                    <p className="text-xs text-destructive">{(errors.pricing_tiers as any).message}</p>
                )}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => append({ label: '', price: 0, description: '' })}
                >
                    <Plus className="h-4 w-4" /> Add Another Tier
                </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/app/services/${service.id}`)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" /> Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
