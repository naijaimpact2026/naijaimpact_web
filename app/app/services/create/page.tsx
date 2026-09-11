'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import
    {
        Plus,
        Trash2,
        ChevronRight,
        ChevronLeft,
        Briefcase,
        Tag,
        Eye,
        Loader2,
        Check,
    } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createService } from '@/lib/actions/services'

// ─── Zod schema ────────────────────────────────────────────────────────────────

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
    pricing_tiers: z
        .array(pricingTierSchema)
        .min(1, 'Add at least one pricing tier'),
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

const STEPS = ['Details', 'Pricing', 'Review'] as const

// ─── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number })
{
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${idx < current
                                    ? 'bg-primary text-primary-foreground'
                                    : idx === current
                                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {idx < current ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <span
                            className={`text-sm font-medium hidden sm:block ${idx === current ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                        >
                            {label}
                        </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div className={`h-px w-8 sm:w-16 ${idx < current ? 'bg-primary' : 'bg-border'}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Step 1: Details ───────────────────────────────────────────────────────────

interface Step1Props
{
    form: ReturnType<typeof useForm<ServiceFormValues>>
    onNext: () => void
}

function Step1Details({ form, onNext }: Step1Props)
{
    const {
        register,
        formState: { errors },
        trigger,
        watch,
        setValue,
    } = form
    const coverUrl = watch('cover_url')

    async function handleNext()
    {
        const valid = await trigger(['title', 'description', 'category'])
        if (valid) onNext()
    }

    return (
        <div className="space-y-5">
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
                    placeholder="Describe your service in detail — what you offer, deliverables, timeline, requirements…"
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
                <Label>Cover Image (optional)</Label>
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

            <div className="flex justify-end pt-2">
                <Button type="button" onClick={handleNext} className="gap-2">
                    Next: Pricing <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

// ─── Step 2: Pricing tiers ─────────────────────────────────────────────────────

interface Step2Props
{
    form: ReturnType<typeof useForm<ServiceFormValues>>
    onBack: () => void
    onNext: () => void
}

function Step2Pricing({ form, onBack, onNext }: Step2Props)
{
    const {
        register,
        control,
        formState: { errors },
        trigger,
    } = form

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'pricing_tiers',
    })

    async function handleNext()
    {
        const valid = await trigger('pricing_tiers')
        if (valid) onNext()
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
                Add at least one pricing tier. Each tier defines a package level with a name, price, and
                short description.
            </p>

            <div className="space-y-4">
                {fields.map((field, idx) =>
                {
                    const tierErrors = errors.pricing_tiers?.[idx]
                    return (
                        <div key={field.id} className="bento-card noise-bg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Tier {idx + 1}
                                </span>
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
                                {/* Label */}
                                <div className="space-y-1">
                                    <Label htmlFor={`tier-${idx}-label`}>
                                        Tier Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id={`tier-${idx}-label`}
                                        placeholder="e.g. Basic, Standard, Premium"
                                        {...register(`pricing_tiers.${idx}.label`)}
                                        aria-invalid={!!tierErrors?.label}
                                    />
                                    {tierErrors?.label && (
                                        <p className="text-xs text-destructive">{tierErrors.label.message}</p>
                                    )}
                                </div>

                                {/* Price */}
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

                            {/* Description */}
                            <div className="space-y-1">
                                <Label htmlFor={`tier-${idx}-description`}>
                                    What&apos;s included (optional)
                                </Label>
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
            {(errors.pricing_tiers as any)?.root?.message && (
                <p className="text-xs text-destructive">{(errors.pricing_tiers as any).root.message}</p>
            )}

            <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => append({ label: '', price: 0, description: '' })}
            >
                <Plus className="h-4 w-4" /> Add Another Tier
            </Button>

            <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={handleNext} className="gap-2">
                    Next: Review <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

// ─── Step 3: Review ────────────────────────────────────────────────────────────

interface Step3Props
{
    values: ServiceFormValues
    onBack: () => void
    onSubmit: () => void
    isSubmitting: boolean
}

function Step3Review({ values, onBack, onSubmit, isSubmitting }: Step3Props)
{
    return (
        <div className="space-y-5">
            {/* Basic info summary */}
            <div className="bento-card noise-bg p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" /> Service Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                            Title
                        </p>
                        <p className="font-medium mt-0.5">{values.title}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                            Category
                        </p>
                        <p className="mt-0.5">
                            <Badge variant="outline">{values.category}</Badge>
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                            Cover image
                        </p>
                        <p className="mt-0.5">
                            {values.cover_url ? (
                                <Badge variant="outline" className="text-primary border-primary/30 gap-1">
                                    <Check className="h-3 w-3" /> Uploaded
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                            )}
                        </p>
                    </div>
                </div>
                {values.description && (
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                            Description
                        </p>
                        <p className="text-sm mt-0.5 leading-relaxed line-clamp-3">{values.description}</p>
                    </div>
                )}
            </div>

            {/* Pricing summary */}
            <div className="bento-card noise-bg p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Pricing — {values.pricing_tiers.length} tier
                    {values.pricing_tiers.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                    {[...values.pricing_tiers]
                        .sort((a, b) => Number(a.price) - Number(b.price))
                        .map((tier, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                            >
                                <span className="font-medium">{tier.label}</span>
                                <span className="font-bold text-primary">
                                    ₦{Number(tier.price).toLocaleString('en-NG')}
                                </span>
                            </div>
                        ))}
                </div>
            </div>

            <div className="bento-card noise-bg p-4 bg-primary/5 border-primary/20 space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> Your listing will be visible in the services
                    catalogue immediately.
                </p>
                <p className="text-xs text-muted-foreground">
                    You can edit or remove it at any time from the listing page.
                </p>
            </div>

            <div className="flex justify-between pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="gap-2"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                        </>
                    ) : (
                        'Publish Listing'
                    )}
                </Button>
            </div>
        </div>
    )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CreateServicePage()
{
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            title: '',
            description: '',
            category: undefined,
            cover_url: null,
            pricing_tiers: [{ label: '', price: 0, description: '' }],
        },
    })

    async function handleSubmit()
    {
        const values = form.getValues()
        setIsSubmitting(true)
        try
        {
            const { id } = await createService({
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
            toast.success('Service listing published!')
            router.push(`/app/services/${id}`)
        } catch (err)
        {
            const msg = err instanceof Error ? err.message : 'Failed to publish listing'
            toast.error(msg)
        } finally
        {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold text-gradient">List a Service</h1>
                <p className="text-muted-foreground text-sm">
                    Offer your skills to the HubNovo community.
                </p>
            </div>

            <StepIndicator current={step} />

            <div className="bento-card noise-bg p-6">
                {step === 0 && <Step1Details form={form} onNext={() => setStep(1)} />}
                {step === 1 && (
                    <Step2Pricing form={form} onBack={() => setStep(0)} onNext={() => setStep(2)} />
                )}
                {step === 2 && (
                    <Step3Review
                        values={form.getValues()}
                        onBack={() => setStep(1)}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </main>
    )
}
