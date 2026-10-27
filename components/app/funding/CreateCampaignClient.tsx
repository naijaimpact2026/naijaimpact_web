'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Megaphone,
  Rocket,
  Loader2,
  Trash2,
  Sparkles,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createCampaign } from '@/lib/actions/funding'
import { toast } from 'sonner'
import type { FundingCategory, FundingType } from '@/lib/types'
import { toPublicStorageUrl } from '@/lib/supabase-image'

const createSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or less'),
  funding_type: z.enum(['campaign', 'project']),
  category_id: z.string().optional(),
  goal_amount: z
    .number({ invalid_type_error: 'Goal amount is required' })
    .min(1000, 'Goal must be at least ₦1,000')
    .max(10_000_000_000, 'Goal exceeds maximum allowed'),
  impact: z.string().max(300, 'Impact statement must be 300 characters or less').optional(),
  description: z.string().max(8000, 'Description must be 8000 characters or less').optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

interface CreateCampaignClientProps {
  categories: FundingCategory[]
  currentUser: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export default function CreateCampaignClient({
  categories,
  currentUser,
}: CreateCampaignClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '',
      funding_type: 'campaign',
      category_id: '',
      goal_amount: 100000,
      impact: '',
      description: '',
    },
  })

  const {
    watch,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = form

  const currentType = watch('funding_type')
  const currentTitle = watch('title')
  const currentGoal = watch('goal_amount')
  const currentImpact = watch('impact')
  const currentCategory = categories.find((c) => c.id === watch('category_id'))

  const handleMediaUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setCoverUrl(files[0].secure_url)
      toast.success('Cover image uploaded!')
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(['title', 'funding_type', 'category_id'])
      if (valid) setStep(2)
    } else if (step === 2) {
      const valid = await trigger(['goal_amount', 'impact', 'description'])
      if (valid) setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2)
  }

  async function onSubmit(values: CreateFormValues) {
    setSubmitting(true)
    try {
      const res = await createCampaign({
        title: values.title,
        funding_type: values.funding_type as FundingType,
        category_id: values.category_id === '__others__' ? null : values.category_id || null,
        goal_amount: values.goal_amount,
        impact: values.impact || null,
        description: values.description || null,
        cover_image_url: coverUrl,
      })

      toast.success('Your campaign has been launched successfully!')
      router.push(`/app/funding/${res.id}`)
      router.refresh()
    } catch (err: any) {
      console.error('Launch campaign error:', err)
      toast.error(err.message || 'Failed to create campaign')
      setSubmitting(false)
    }
  }

  const previewCover = toPublicStorageUrl(coverUrl)

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-sm">
        {[
          { num: 1, title: 'Basics' },
          { num: 2, title: 'Impact & Target' },
          { num: 3, title: 'Media & Preview' },
        ].map((s) => {
          const isActive = step === s.num
          const isDone = step > s.num
          return (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.title}
              </span>
              {s.num < 3 && <div className="h-0.5 flex-1 bg-border hidden sm:block" />}
            </div>
          )
        })}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── STEP 1: BASICS ── */}
        {step === 1 && (
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6 animate-in fade-in-50 duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">What are you funding?</h2>
              <p className="text-xs text-muted-foreground">
                Choose the initiative type that best represents your vision.
              </p>
            </div>

            {/* Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue('funding_type', 'campaign')}
                className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                  currentType === 'campaign'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/25 ring-2 ring-emerald-600/30'
                    : 'border-border bg-card hover:border-emerald-600/40'
                }`}
              >
                <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Community Campaign</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Ideal for community initiatives, local relief, schools, clinics, and charitable causes.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('funding_type', 'project')}
                className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                  currentType === 'project'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/25 ring-2 ring-amber-600/30'
                    : 'border-border bg-card hover:border-amber-600/40'
                }`}
              >
                <div className="p-3 rounded-xl bg-amber-600 text-white shrink-0">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Project Venture</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Designed for startups, creative ventures, technology builds, and artisan products.
                  </p>
                </div>
              </button>
            </div>

            {/* Title & Category */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Campaign Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Clean Water Borehole for Ibadan Youth Community"
                  {...register('title')}
                  className="rounded-xl h-11"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Category</Label>
                <Select
                  value={watch('category_id') || undefined}
                  onValueChange={(val) => setValue('category_id', val)}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__others__">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: IMPACT & TARGET ── */}
        {step === 2 && (
          <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6 animate-in fade-in-50 duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Impact & Budget Target</h2>
              <p className="text-xs text-muted-foreground">
                Set a realistic funding goal and explain the impact of this initiative.
              </p>
            </div>

            {/* Goal Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="goal_amount" className="text-sm font-semibold">
                Target Funding Goal (₦) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="goal_amount"
                  type="number"
                  min={1000}
                  className="pl-8 rounded-xl h-11 text-base font-bold"
                  value={watch('goal_amount') ?? ''}
                  onChange={(e) => setValue('goal_amount', Number(e.target.value))}
                />
              </div>
              {errors.goal_amount && (
                <p className="text-xs text-destructive">{errors.goal_amount.message}</p>
              )}
            </div>

            {/* Impact Pitch */}
            <div className="space-y-1.5">
              <Label htmlFor="impact" className="text-sm font-semibold">
                Impact Pitch <span className="text-xs text-muted-foreground font-normal">(One-sentence pitch)</span>
              </Label>
              <Input
                id="impact"
                placeholder="What tangible problem does this solve for the community?"
                {...register('impact')}
                className="rounded-xl h-11"
              />
              {errors.impact && (
                <p className="text-xs text-destructive">{errors.impact.message}</p>
              )}
            </div>

            {/* Full Story */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold">
                Full Story & Execution Plan
              </Label>
              <Textarea
                id="description"
                rows={6}
                placeholder="Describe how the funds will be used, milestones, timelines, and why supporters should back you..."
                {...register('description')}
                className="rounded-xl leading-relaxed resize-y"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: MEDIA & PREVIEW ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in-50 duration-300">
            {/* Left: Media upload */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Cover Media</h2>
                <p className="text-xs text-muted-foreground">
                  Upload an engaging banner or photo representing your project.
                </p>
              </div>

              {previewCover ? (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={previewCover}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <MediaUploader
                    onUploadComplete={handleMediaUpload}
                    maxImages={1}
                    maxVideos={0}
                    className="rounded-2xl"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> High resolution JPG or PNG recommended.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitting}
                  className="gap-2 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 py-5 shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Publish Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Live Mockup Card Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Card Preview
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Live Preview
                </span>
              </div>

              <div className="max-w-sm mx-auto w-full">
                <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card shadow-md">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {previewCover ? (
                      <Image
                        src={previewCover}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-800 to-teal-900 text-white">
                        <span className="text-4xl opacity-50">
                          {currentType === 'campaign' ? '📣' : '🚀'}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white bg-emerald-600/90 shadow-sm backdrop-blur-md">
                        {currentType === 'campaign' ? '📣 Campaign' : '🚀 Project'}
                      </span>
                      {currentCategory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-md">
                          {currentCategory.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-sm line-clamp-2">
                      {currentTitle || 'Your Campaign Title'}
                    </h3>

                    {currentImpact && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {currentImpact}
                      </p>
                    )}

                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold">₦0 raised</span>
                        <span className="text-muted-foreground">
                          Goal: ₦{(currentGoal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500 w-1 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
