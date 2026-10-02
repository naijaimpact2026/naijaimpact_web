'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
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
  Megaphone,
  Rocket,
  Loader2,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { updateCampaign, deleteCampaign } from '@/lib/actions/funding'
import { toast } from 'sonner'
import type { Campaign, FundingCategory, FundingType } from '@/lib/types'
import { toPublicStorageUrl } from '@/lib/supabase-image'

const editCampaignSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or less'),
  funding_type: z.enum(['campaign', 'project']),
  category_id: z.string().optional(),
  goal_amount: z
    .number({ invalid_type_error: 'Goal amount is required' })
    .min(1000, 'Goal must be at least ₦1,000'),
  impact: z.string().max(300, 'Impact summary must be 300 characters or less').optional(),
  description: z.string().max(8000, 'Description must be 8000 characters or less').optional(),
})

type EditCampaignFormValues = z.infer<typeof editCampaignSchema>

interface FundingEditFormProps {
  campaign: Campaign
  categories: FundingCategory[]
}

export default function FundingEditForm({ campaign, categories }: FundingEditFormProps) {
  const router = useRouter()
  const [coverUrl, setCoverUrl] = useState<string | null>(
    campaign.cover_image_url || campaign.cover_url || null
  )
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<EditCampaignFormValues>({
    resolver: zodResolver(editCampaignSchema),
    defaultValues: {
      title: campaign.title || '',
      funding_type: campaign.funding_type || 'campaign',
      category_id: campaign.category_id || '',
      goal_amount: campaign.goal_amount || 50000,
      impact: campaign.impact || '',
      description: campaign.description || '',
    },
  })

  const currentType = form.watch('funding_type')

  const handleMediaUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setCoverUrl(files[0].secure_url)
      toast.success('Cover image uploaded!')
    }
  }

  async function onSubmit(values: EditCampaignFormValues) {
    setSubmitting(true)
    try {
      await updateCampaign(campaign.id, {
        title: values.title,
        funding_type: values.funding_type as FundingType,
        category_id: values.category_id === '__others__' ? null : values.category_id || null,
        goal_amount: values.goal_amount,
        impact: values.impact || null,
        description: values.description || null,
        cover_image_url: coverUrl,
      })

      toast.success('Campaign updated successfully!')
      router.push(`/app/funding/${campaign.id}`)
      router.refresh()
    } catch (err: any) {
      console.error('Update campaign error:', err)
      toast.error(err.message || 'Failed to update campaign')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteCampaign(campaign.id)
      toast.success('Campaign removed')
      router.push('/app/funding')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign')
      setDeleting(false)
    }
  }

  const previewCover = toPublicStorageUrl(coverUrl)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Initiative Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => form.setValue('funding_type', 'campaign')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              currentType === 'campaign'
                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-600/30'
                : 'border-border bg-card text-foreground hover:border-emerald-600/40'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Campaign</p>
              <p className="text-xs text-muted-foreground">Community causes & emergency relief</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => form.setValue('funding_type', 'project')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              currentType === 'project'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 ring-2 ring-amber-600/30'
                : 'border-border bg-card text-foreground hover:border-amber-600/40'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-amber-600 text-white shrink-0">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Project</p>
              <p className="text-xs text-muted-foreground">Creative, business & tech ventures</p>
            </div>
          </button>
        </div>
      </div>

      {/* Title & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-semibold">
            Campaign Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g. Solar Power for Lagos Tech Hub"
            {...form.register('title')}
            className="rounded-xl"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Category</Label>
          <Select
            value={form.watch('category_id') || undefined}
            onValueChange={(val) => form.setValue('category_id', val)}
          >
            <SelectTrigger className="rounded-xl">
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

      {/* Goal Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="goal_amount" className="text-sm font-semibold">
          Target Goal Amount (₦) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            ₦
          </span>
          <Input
            id="goal_amount"
            type="number"
            min={1000}
            className="pl-8 rounded-xl font-bold"
            value={form.watch('goal_amount') ?? ''}
            onChange={(e) => form.setValue('goal_amount', Number(e.target.value))}
          />
        </div>
        {form.formState.errors.goal_amount && (
          <p className="text-xs text-destructive">{form.formState.errors.goal_amount.message}</p>
        )}
      </div>

      {/* Impact Pitch */}
      <div className="space-y-1.5">
        <Label htmlFor="impact" className="text-sm font-semibold">
          Impact Pitch <span className="text-xs text-muted-foreground font-normal">(One-liner pitch)</span>
        </Label>
        <Input
          id="impact"
          placeholder="What specific impact will this project deliver?"
          {...form.register('impact')}
          className="rounded-xl"
        />
        {form.formState.errors.impact && (
          <p className="text-xs text-destructive">{form.formState.errors.impact.message}</p>
        )}
      </div>

      {/* Story / Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-semibold">
          Full Story & Plan
        </Label>
        <Textarea
          id="description"
          rows={6}
          placeholder="Share background, execution timeline, budget breakdown, and how donors can track progress..."
          {...form.register('description')}
          className="rounded-xl leading-relaxed resize-y"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Cover Image */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-sm font-semibold">Cover Media</Label>

        {previewCover ? (
          <div className="relative aspect-[16/9] w-full max-w-lg rounded-2xl overflow-hidden border border-border bg-muted">
            <Image
              src={previewCover}
              alt="Campaign cover preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
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
              <ImageIcon className="w-3.5 h-3.5" /> High-resolution JPG or PNG recommended (16:9 ratio).
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting || submitting}
          className="w-full sm:w-auto gap-2"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Campaign
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting || deleting}
            className="w-full sm:w-auto rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting || deleting}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
