'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import Image from 'next/image'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// import
//     {
//         ArrowLeft,
//         ArrowRight,
//         Megaphone,
//         FolderKanban,
//         CheckCircle2,
//         Loader2,
//     } from 'lucide-react'
// import { MediaUploader, UploadedFile } from '@/components/app/MediaUploader'
// import { updateCampaign } from '@/lib/actions/funding'
// import { toast } from 'sonner'
// import { cn } from '@/lib/utils'
// import type { Campaign } from '@/lib/types'

// // ─── Zod schema ───────────────────────────────────────────────────────────────

// const step2Schema = z.object({
//     title: z
//         .string()
//         .min(1, 'Title is required')
//         .max(100, 'Title must be 100 characters or less'),
//     description: z.string().max(5000, 'Description must be 5000 characters or less'),
//     goal_amount: z
//         .number({ invalid_type_error: 'Goal amount is required' })
//         .min(1000, 'Goal must be at least ₦1,000'),
//     deadline: z.string().refine((val) =>
//     {
//         if (!val) return false
//         const date = new Date(val)
//         return date > new Date()
//     }, 'Deadline must be a future date'),
// })

// type Step2Data = z.infer<typeof step2Schema>

// // ─── Step indicator ───────────────────────────────────────────────────────────

// function StepIndicator({ current, total }: { current: number; total: number })
// {
//     return (
//         <div className="flex items-center gap-2 mb-6">
//             {Array.from({ length: total }).map((_, i) => (
//                 <div
//                     key={i}
//                     className={cn(
//                         'h-2 flex-1 rounded-full transition-all duration-300',
//                         i < current ? 'bg-primary' : i === current ? 'bg-primary/60' : 'bg-muted'
//                     )}
//                 />
//             ))}
//             <span className="text-sm text-muted-foreground ml-2 shrink-0">
//                 {current + 1} of {total}
//             </span>
//         </div>
//     )
// }

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface FundingEditFormProps
// {
//     campaign: Campaign
// }

// // ─── Main component ───────────────────────────────────────────────────────────

// export default function FundingEditForm({ campaign }: FundingEditFormProps)
// {
//     const router = useRouter()
//     const [step, setStep] = useState(0)
//     const [campaignType, setCampaignType] = useState<'campaign' | 'project'>(campaign.type)
//     // Pre-populate cover from existing data; null means cleared
//     const [coverFile, setCoverFile] = useState<UploadedFile | null>(
//         campaign.cover_url
//             ? { secure_url: campaign.cover_url, public_id: '', mediaType: 'image' }
//             : null
//     )
//     const [submitting, setSubmitting] = useState(false)

//     const form = useForm<Step2Data>({
//         resolver: zodResolver(step2Schema),
//         defaultValues: {
//             title: campaign.title,
//             description: campaign.description ?? '',
//             goal_amount: campaign.goal_amount,
//             // Deadline from DB may be "YYYY-MM-DD" — use directly
//             deadline: campaign.deadline.substring(0, 10),
//         },
//     })

//     const { register, watch, trigger, formState: { errors } } = form
//     const titleValue = watch('title') ?? ''
//     const descValue = watch('description') ?? ''

//     // ── Navigation ───────────────────────────────────────────────────────────────

//     async function handleNext()
//     {
//         if (step === 0)
//         {
//             setStep(1)
//         } else if (step === 1)
//         {
//             const valid = await trigger()
//             if (valid) setStep(2)
//         } else if (step === 2)
//         {
//             setStep(3)
//         }
//     }

//     function handleBack()
//     {
//         if (step > 0) setStep((s) => s - 1)
//     }

//     // ── Submit ───────────────────────────────────────────────────────────────────

//     async function handleFinalSubmit()
//     {
//         const values = form.getValues()
//         setSubmitting(true)
//         try
//         {
//             await updateCampaign(campaign.id, {
//                 type: campaignType,
//                 title: values.title,
//                 description: values.description,
//                 goal_amount: values.goal_amount,
//                 deadline: values.deadline,
//                 cover_url: coverFile?.secure_url ?? null,
//             })
//             toast.success('Campaign updated successfully!')
//             router.push(`/app/funding/${campaign.id}`)
//         } catch (err: any)
//         {
//             toast.error(err?.message ?? 'Failed to update campaign')
//             setSubmitting(false)
//         }
//     }

//     // ── Render ───────────────────────────────────────────────────────────────────

//     return (
//         <div className="bento-card noise-bg p-6">
//             <StepIndicator current={step} total={4} />

//             {/* Step 0 — Type */}
//             {step === 0 && (
//                 <div className="space-y-4">
//                     <h2 className="text-lg font-semibold">Campaign type</h2>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <button
//                             type="button"
//                             onClick={() => setCampaignType('campaign')}
//                             className={cn(
//                                 'bento-card noise-bg p-5 text-left border-2 transition-all duration-200 rounded-xl',
//                                 campaignType === 'campaign'
//                                     ? 'border-primary bg-primary/5'
//                                     : 'border-border hover:border-primary/40'
//                             )}
//                         >
//                             <div className="flex items-center gap-3 mb-3">
//                                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//                                     <Megaphone className="h-5 w-5 text-primary" />
//                                 </div>
//                                 <span className="font-semibold">Campaign</span>
//                                 {campaignType === 'campaign' && (
//                                     <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
//                                 )}
//                             </div>
//                             <p className="text-sm text-muted-foreground">
//                                 Raise funds for a personal cause, emergency, or social impact initiative.
//                             </p>
//                         </button>

//                         <button
//                             type="button"
//                             onClick={() => setCampaignType('project')}
//                             className={cn(
//                                 'bento-card noise-bg p-5 text-left border-2 transition-all duration-200 rounded-xl',
//                                 campaignType === 'project'
//                                     ? 'border-primary bg-primary/5'
//                                     : 'border-border hover:border-primary/40'
//                             )}
//                         >
//                             <div className="flex items-center gap-3 mb-3">
//                                 <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
//                                     <FolderKanban className="h-5 w-5 text-secondary" />
//                                 </div>
//                                 <span className="font-semibold">Project</span>
//                                 {campaignType === 'project' && (
//                                     <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
//                                 )}
//                             </div>
//                             <p className="text-sm text-muted-foreground">
//                                 Fund a community initiative or creative project with a clear deliverable.
//                             </p>
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* Step 1 — Details */}
//             {step === 1 && (
//                 <div className="space-y-5">
//                     <h2 className="text-lg font-semibold">Campaign details</h2>

//                     <div className="space-y-1.5">
//                         <div className="flex items-center justify-between">
//                             <Label htmlFor="title">Title</Label>
//                             <span className="text-xs text-muted-foreground">{titleValue.length}/100</span>
//                         </div>
//                         <Input
//                             id="title"
//                             placeholder="Give your campaign a clear, compelling title"
//                             {...register('title')}
//                             aria-invalid={!!errors.title}
//                         />
//                         {errors.title && (
//                             <p className="text-xs text-destructive">{errors.title.message}</p>
//                         )}
//                     </div>

//                     <div className="space-y-1.5">
//                         <div className="flex items-center justify-between">
//                             <Label htmlFor="description">Description</Label>
//                             <span className="text-xs text-muted-foreground">{descValue.length}/5000</span>
//                         </div>
//                         <Textarea
//                             id="description"
//                             placeholder="Tell your story"
//                             rows={6}
//                             {...register('description')}
//                             aria-invalid={!!errors.description}
//                         />
//                         {errors.description && (
//                             <p className="text-xs text-destructive">{errors.description.message}</p>
//                         )}
//                     </div>

//                     <div className="space-y-1.5">
//                         <Label htmlFor="goal_amount">Goal amount</Label>
//                         <div className="relative">
//                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
//                                 ₦
//                             </span>
//                             <Input
//                                 id="goal_amount"
//                                 type="number"
//                                 min={1000}
//                                 step={1}
//                                 placeholder="10000"
//                                 className="pl-7"
//                                 {...register('goal_amount', { valueAsNumber: true })}
//                                 aria-invalid={!!errors.goal_amount}
//                             />
//                         </div>
//                         {errors.goal_amount && (
//                             <p className="text-xs text-destructive">{errors.goal_amount.message}</p>
//                         )}
//                     </div>

//                     <div className="space-y-1.5">
//                         <Label htmlFor="deadline">Deadline</Label>
//                         <Input
//                             id="deadline"
//                             type="date"
//                             min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
//                             {...register('deadline')}
//                             aria-invalid={!!errors.deadline}
//                         />
//                         {errors.deadline && (
//                             <p className="text-xs text-destructive">{errors.deadline.message}</p>
//                         )}
//                     </div>
//                 </div>
//             )}

//             {/* Step 2 — Cover image */}
//             {step === 2 && (
//                 <div className="space-y-4">
//                     <div>
//                         <h2 className="text-lg font-semibold">Cover image</h2>
//                         <p className="text-sm text-muted-foreground mt-1">
//                             Update or keep the existing cover image. You can also remove it.
//                         </p>
//                     </div>

//                     {coverFile ? (
//                         <div className="space-y-3">
//                             <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
//                                 <Image
//                                     src={coverFile.secure_url}
//                                     alt="Cover preview"
//                                     fill
//                                     className="object-cover"
//                                     sizes="(max-width: 768px) 100vw, 672px"
//                                 />
//                             </div>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => setCoverFile(null)}
//                             >
//                                 Remove image
//                             </Button>
//                         </div>
//                     ) : (
//                         <MediaUploader
//                             maxImages={1}
//                             maxVideos={0}
//                             onUploadComplete={(files) =>
//                             {
//                                 if (files.length > 0) setCoverFile(files[0])
//                             }}
//                         />
//                     )}
//                 </div>
//             )}

//             {/* Step 3 — Review */}
//             {step === 3 && (
//                 <div className="space-y-5">
//                     <h2 className="text-lg font-semibold">Review your changes</h2>

//                     {coverFile && (
//                         <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
//                             <Image
//                                 src={coverFile.secure_url}
//                                 alt="Campaign cover"
//                                 fill
//                                 className="object-cover"
//                                 sizes="(max-width: 768px) 100vw, 672px"
//                             />
//                         </div>
//                     )}

//                     <div className="space-y-3 text-sm">
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Type</span>
//                             <span className="font-medium capitalize">{campaignType}</span>
//                         </div>
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Title</span>
//                             <span className="font-medium">{form.getValues('title')}</span>
//                         </div>
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Description</span>
//                             <span className="line-clamp-4">{form.getValues('description') || '—'}</span>
//                         </div>
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Goal</span>
//                             <span className="font-medium">
//                                 ₦{form.getValues('goal_amount')?.toLocaleString('en-NG')}
//                             </span>
//                         </div>
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Deadline</span>
//                             <span className="font-medium">
//                                 {new Date(form.getValues('deadline')).toLocaleDateString('en-NG', {
//                                     day: 'numeric',
//                                     month: 'long',
//                                     year: 'numeric',
//                                 })}
//                             </span>
//                         </div>
//                         <div className="flex items-start gap-3">
//                             <span className="text-muted-foreground w-28 shrink-0">Cover</span>
//                             <span>{coverFile ? 'Set' : 'None'}</span>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Navigation */}
//             <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
//                 <Button
//                     type="button"
//                     variant="outline"
//                     onClick={handleBack}
//                     disabled={step === 0 || submitting}
//                     className="gap-2"
//                 >
//                     <ArrowLeft className="h-4 w-4" />
//                     Back
//                 </Button>

//                 {step < 3 ? (
//                     <Button
//                         type="button"
//                         onClick={handleNext}
//                         disabled={submitting}
//                         className="gradient-primary text-white gap-2"
//                     >
//                         {step === 2 ? 'Review' : 'Next'}
//                         <ArrowRight className="h-4 w-4" />
//                     </Button>
//                 ) : (
//                     <Button
//                         type="button"
//                         onClick={handleFinalSubmit}
//                         disabled={submitting}
//                         className="gradient-primary text-white gap-2"
//                     >
//                         {submitting ? (
//                             <>
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                 Saving...
//                             </>
//                         ) : (
//                             'Save Changes'
//                         )}
//                     </Button>
//                 )}
//             </div>
//         </div>
//     )
// }
