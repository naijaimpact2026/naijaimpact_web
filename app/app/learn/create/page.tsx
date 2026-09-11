'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import
{
    Plus, Trash2, ChevronRight, ChevronLeft,
    GraduationCap, BookOpen, Eye, Video, Check,
    Tag, FileText, AlertTriangle,
} from 'lucide-react'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { createCourse, fetchCategories } from '@/lib/actions/learn'
import type { Category, CourseOutlineSection } from '@/lib/actions/learn'

// ─── Schema ───────────────────────────────────────────────────────────────────

const lessonSchema = z.object({
    title: z.string().min(1, 'Lesson title required'),
    video_url: z.string().nullable(),
})
const sectionSchema = z.object({
    title: z.string().min(1, 'Section title required'),
    lessons: z.array(lessonSchema).min(1, 'Add at least one lesson'),
})
const courseSchema = z.object({
    title: z.string().min(3, 'At least 3 characters'),
    description: z.string().min(10, 'At least 10 characters'),
    category_id: z.string().min(1, 'Select a category'),
    amount: z.coerce.number().min(0),
    is_free: z.boolean(),
    cover_image_url: z.string().nullable(),
    video_url: z.string().nullable(),
    sections: z.array(sectionSchema).min(1, 'Add at least one section'),
})
type CourseFormValues = z.infer<typeof courseSchema>
const STEPS = ['Basic Info', 'Curriculum', 'Review'] as const

// ─── Field styles ─────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
const textareaCls = inputCls + " resize-none"

function Field({ label, required, hint, error, children }: {
    label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
})
{
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number })
{
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx < current ? 'bg-green-600 text-white' :
                            idx === current ? 'bg-green-700 text-white ring-4 ring-green-500/20' :
                                'bg-muted text-muted-foreground'
                            }`}>
                            {idx < current ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-sm font-semibold hidden sm:block ${idx === current ? 'text-foreground' : idx < current ? 'text-green-700' : 'text-muted-foreground'
                            }`}>{label}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div className={`h-0.5 w-10 sm:w-16 rounded-full ${idx < current ? 'bg-green-500' : 'bg-border'}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ form, categories, onNext }: {
    form: ReturnType<typeof useForm<CourseFormValues>>
    categories: Category[]
    onNext: () => void
})
{
    const { register, formState: { errors }, trigger, watch, setValue } = form
    const cover = watch('cover_image_url')
    const introVideo = watch('video_url')
    const isFree = watch('is_free')
    const amount = watch('amount')

    async function go()
    {
        const ok = await trigger(['title', 'description', 'category_id'])
        if (ok) onNext()
    }

    return (
        <div className="space-y-6">
            <Field label="Course Title" required error={errors.title?.message}>
                <input {...register('title')} placeholder="e.g. Personal Finance Mastery" className={inputCls} />
            </Field>

            <Field label="Description" required error={errors.description?.message}
                hint="Describe what students will learn">
                <textarea {...register('description')} rows={4}
                    placeholder="What will students learn? Who is this for?" className={textareaCls} />
            </Field>

            {/* Category */}
            <Field label="Category" required error={errors.category_id?.message}>
                <div className="relative">
                    <select {...register('category_id')}
                        className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors cursor-pointer">
                        <option value="" className="text-muted-foreground">Select a category…</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id} className="text-foreground bg-card">{c.name}</option>
                        ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90" />
                </div>
            </Field>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Pricing" hint="Toggle free / paid">
                    <div className="flex items-center gap-3 mt-1">
                        <button type="button" onClick={() => setValue('is_free', true)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${isFree ? 'bg-green-700 text-white border-green-700' : 'bg-card text-muted-foreground border-border'}`}>
                            Free
                        </button>
                        <button type="button" onClick={() => setValue('is_free', false)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${!isFree ? 'bg-green-700 text-white border-green-700' : 'bg-card text-muted-foreground border-border'}`}>
                            Paid
                        </button>
                    </div>
                </Field>

                {!isFree && (
                    <Field label="Amount (₦)" error={errors.amount?.message}>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>
                            <input {...register('amount')} type="number" min={0} step={500}
                                placeholder="5000" className={inputCls + " pl-8"} />
                        </div>
                    </Field>
                )}
            </div>

            {/* Thumbnail */}
            <Field label="Cover Image" hint="Recommended: 1280×720">
                {cover ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cover} alt="Cover" className="w-full h-44 object-cover" />
                        <button type="button" onClick={() => setValue('cover_image_url', null)}
                            className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">
                            Remove
                        </button>
                    </div>
                ) : (
                    <MediaUploader maxImages={1} maxVideos={0}
                        onUploadComplete={(files: UploadedFile[]) =>
                        {
                            if (files[0]) setValue('cover_image_url', files[0].secure_url)
                        }} />
                )}
            </Field>

            {/* Intro video */}
            <Field label="Intro / Preview Video" hint="Optional short preview video for the course">
                {introVideo ? (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                            <Video className="w-3.5 h-3.5" /> Video uploaded
                        </span>
                        <button type="button" onClick={() => setValue('video_url', null)}
                            className="text-xs text-muted-foreground hover:text-rose-500 underline">Remove</button>
                    </div>
                ) : (
                    <MediaUploader maxImages={0} maxVideos={1}
                        onUploadComplete={(files: UploadedFile[]) =>
                        {
                            if (files[0]) setValue('video_url', files[0].secure_url)
                        }} />
                )}
            </Field>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={go}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                    Next: Curriculum <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({ sIdx, lIdx, form, onVideoUpload, canRemove, onRemove }: {
    sIdx: number; lIdx: number
    form: ReturnType<typeof useForm<CourseFormValues>>
    onVideoUpload: (si: number, li: number, files: UploadedFile[]) => void
    canRemove: boolean; onRemove: () => void
})
{
    const { register, formState: { errors }, watch, setValue } = form
    const videoUrl = watch(`sections.${sIdx}.lessons.${lIdx}.video_url`)
    const err = errors.sections?.[sIdx]?.lessons?.[lIdx]

    return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border border-border">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                {lIdx + 1}
            </div>
            <div className="flex-1 space-y-3">
                <input {...register(`sections.${sIdx}.lessons.${lIdx}.title`)}
                    placeholder={`Lesson ${lIdx + 1} title`} className={inputCls} />
                {err?.title && <p className="text-xs text-rose-500">{err.title.message}</p>}
                {videoUrl ? (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                            <Video className="w-3.5 h-3.5" /> Video uploaded
                        </span>
                        <button type="button" onClick={() => setValue(`sections.${sIdx}.lessons.${lIdx}.video_url`, null)}
                            className="text-xs text-muted-foreground hover:text-rose-500 underline">Remove</button>
                    </div>
                ) : (
                    <MediaUploader maxImages={0} maxVideos={1}
                        onUploadComplete={(f) => onVideoUpload(sIdx, lIdx, f)} />
                )}
            </div>
            {canRemove && (
                <button type="button" onClick={onRemove}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({ sIdx, form, onVideoUpload, canRemove, onRemove }: {
    sIdx: number
    form: ReturnType<typeof useForm<CourseFormValues>>
    onVideoUpload: (si: number, li: number, files: UploadedFile[]) => void
    canRemove: boolean; onRemove: () => void
})
{
    const { register, control, formState: { errors } } = form
    const { fields, append, remove } = useFieldArray({ control, name: `sections.${sIdx}.lessons` })
    const sErr = errors.sections?.[sIdx]

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className={`px-5 py-4 border-b ${sErr?.title ? 'border-rose-200 bg-rose-50' : 'border-border'}`}
                style={!sErr?.title ? { background: 'linear-gradient(135deg,#e8f5ee,#d0ede0)' } : {}}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        {sIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <input {...register(`sections.${sIdx}.title`)}
                            placeholder={`Enter section ${sIdx + 1} title (required)`}
                            className={`w-full text-sm font-bold focus:outline-none rounded-lg px-2 py-1 transition-colors ${sErr?.title
                                    ? 'bg-card border border-rose-300 text-foreground placeholder:text-rose-400'
                                    : 'bg-white/60 border border-transparent text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-green-400'
                                }`} />
                        {sErr?.title && (
                            <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {sErr.title.message}
                            </p>
                        )}
                    </div>
                    {canRemove && (
                        <button type="button" onClick={onRemove}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-white/60 transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="p-4 space-y-3">
                {fields.map((f, lIdx) => (
                    <LessonRow key={f.id} sIdx={sIdx} lIdx={lIdx} form={form}
                        onVideoUpload={onVideoUpload} canRemove={fields.length > 1}
                        onRemove={() => remove(lIdx)} />
                ))}
                <button type="button"
                    onClick={() => append({ title: '', video_url: null })}
                    className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
                    <Plus className="w-4 h-4" /> Add Lesson
                </button>
            </div>
        </div>
    )
}

// ─── Step 2: Curriculum ───────────────────────────────────────────────────────

function Step2({ form, onVideoUpload, onBack, onNext }: {
    form: ReturnType<typeof useForm<CourseFormValues>>
    onVideoUpload: (si: number, li: number, files: UploadedFile[]) => void
    onBack: () => void; onNext: () => void
})
{
    const { control, formState: { errors }, trigger } = form
    const { fields, append, remove } = useFieldArray({ control, name: 'sections' })

    async function go()
    {
        const ok = await trigger('sections')
        if (ok) onNext()
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Organise your course into sections and lessons.</p>
            {fields.map((f, sIdx) => (
                <SectionBlock key={f.id} sIdx={sIdx} form={form} onVideoUpload={onVideoUpload}
                    canRemove={fields.length > 1} onRemove={() => remove(sIdx)} />
            ))}
            {(errors.sections as any)?.message && (
                <p className="text-xs text-rose-500">{(errors.sections as any).message}</p>
            )}
            <button type="button"
                onClick={() => append({ title: '', lessons: [{ title: '', video_url: null }] })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-green-400 hover:text-green-700 transition-colors">
                <Plus className="w-4 h-4" /> Add Section
            </button>
            <div className="flex justify-between pt-2">
                <button type="button" onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={go}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                    Next: Review <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function Step3({ values, categories, onBack, onPublish, isPublishing }: {
    values: CourseFormValues
    categories: Category[]
    onBack: () => void
    onPublish: () => void
    isPublishing: boolean
})
{
    const totalLessons = values.sections.reduce((s, sec) => s + sec.lessons.length, 0)
    const catName = categories.find(c => c.id === values.category_id)?.name ?? '—'

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border overflow-hidden">
                {values.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values.cover_image_url} alt="" className="w-full h-40 object-cover" />
                ) : (
                    <div className="h-32 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                        <GraduationCap className="w-12 h-12 text-white/30" />
                    </div>
                )}
                <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-foreground text-lg leading-tight">{values.title}</h3>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${values.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {values.is_free ? 'Free' : `₦${Number(values.amount).toLocaleString('en-NG')}`}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{values.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {catName}</span>
                        <span>·</span>
                        <span>{values.sections.length} section{values.sections.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-700" />
                    <span className="font-bold text-foreground text-sm">Curriculum</span>
                </div>
                <div className="divide-y divide-border">
                    {values.sections.map((sec, si) => (
                        <div key={si} className="px-5 py-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Section {si + 1} · {sec.title}
                            </p>
                            <div className="space-y-1.5">
                                {sec.lessons.map((l, li) => (
                                    <div key={li} className="flex items-center gap-2 text-sm text-foreground">
                                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                                            {li + 1}
                                        </span>
                                        <span className="flex-1 truncate">{l.title || <span className="italic text-muted-foreground">Untitled</span>}</span>
                                        {l.video_url && <Video className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                <Eye className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-green-800">Ready to publish?</p>
                    <p className="text-xs text-green-700 mt-0.5">
                        This course will be visible in the catalogue immediately.
                    </p>
                </div>
            </div>

            <div className="flex justify-between pt-2">
                <button type="button" onClick={onBack} disabled={isPublishing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={onPublish} disabled={isPublishing}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all"
                    style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                    {isPublishing ? (
                        <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
                    ) : (
                        <><GraduationCap className="w-4 h-4" /> Publish Course</>
                    )}
                </button>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateCoursePage()
{
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [isPublishing, setIsPublishing] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() =>
    {
        fetchCategories().then(setCategories)
    }, [])

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            title: '', description: '', category_id: '',
            amount: 0, is_free: true,
            cover_image_url: null, video_url: null,
            sections: [{ title: '', lessons: [{ title: '', video_url: null }] }],
        },
    })

    function handleVideoUpload(si: number, li: number, files: UploadedFile[])
    {
        const f = files[0]
        if (f) form.setValue(`sections.${si}.lessons.${li}.video_url`, f.secure_url)
    }

    async function handlePublish()
    {
        const values = form.getValues()
        setIsPublishing(true)
        try
        {
            const outline: CourseOutlineSection[] = values.sections.map(sec => ({
                title: sec.title,
                lessons: sec.lessons.map(l => ({
                    title: l.title,
                    video_url: l.video_url,
                })),
            }))

            const courseId = await createCourse({
                title: values.title,
                description: values.description || null,
                category_id: values.category_id || null,
                amount: values.is_free ? 0 : Number(values.amount),
                is_free: values.is_free,
                cover_image_url: values.cover_image_url,
                video_url: values.video_url,
                course_outline: outline,
            })

            toast.success('Course published!')
            router.push(`/app/learn`)
        } catch (err)
        {
            toast.error(err instanceof Error ? err.message : 'Failed to publish')
        } finally
        {
            setIsPublishing(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero header */}
            <div className="relative overflow-hidden py-8 px-5"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle,#4ade80,transparent)' }} />
                <div className="max-w-2xl mx-auto relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Create a Course</h1>
                        <p className="text-green-300/80 text-sm">Share your expertise with the community</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
                    <StepIndicator current={step} />
                    {step === 0 && (
                        <Step1 form={form} categories={categories} onNext={() => setStep(1)} />
                    )}
                    {step === 1 && (
                        <Step2 form={form} onVideoUpload={handleVideoUpload}
                            onBack={() => setStep(0)} onNext={() => setStep(2)} />
                    )}
                    {step === 2 && (
                        <Step3 values={form.getValues()} categories={categories}
                            onBack={() => setStep(1)} onPublish={handlePublish} isPublishing={isPublishing} />
                    )}
                </div>
            </div>
        </div>
    )
}
