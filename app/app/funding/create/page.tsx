'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import
{
    ArrowLeft, ArrowRight, Megaphone, FolderKanban,
    CheckCircle2, Loader2, Target, Calendar, FileText,
    ImageIcon, Eye, Rocket, TrendingUp, Users, Zap,
    Lightbulb, Pin, PenLine, AlertTriangle, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, UploadedFile } from '@/components/app/MediaUploader'
import { createCampaign } from '@/lib/actions/funding'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const step2Schema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
    description: z.string().max(5000, 'Max 5000 characters'),
    goal_amount: z.number({ invalid_type_error: 'Amount is required' }).min(1000, 'Minimum ₦1,000'),
    deadline: z.string().refine(v => v && new Date(v) > new Date(), 'Must be a future date'),
})
type Step2Data = z.infer<typeof step2Schema>

const STEPS = [
    { id: 0, label: 'Type', icon: FolderKanban },
    { id: 1, label: 'Details', icon: FileText },
    { id: 2, label: 'Cover', icon: ImageIcon },
    { id: 3, label: 'Review', icon: Eye },
]

const TYPE_OPTIONS = [
    {
        val: 'campaign' as const,
        icon: Megaphone,
        title: 'Campaign',
        subtitle: 'Personal or Social Impact',
        desc: 'Raise funds for a personal cause, emergency, or social impact initiative.',
        features: ['Quick setup', 'Share widely', 'Track donations'],
        gradient: 'linear-gradient(135deg,#1a5c38 0%,#0f3d25 100%)',
        lightBg: '#f0fdf4',
        accentColor: '#1a5c38',
        badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
        val: 'project' as const,
        icon: Rocket,
        title: 'Project',
        subtitle: 'Community or Business',
        desc: 'Fund a community initiative, business idea, or creative project with clear deliverables.',
        features: ['Milestone tracking', 'Clear deliverables', 'Backer updates'],
        gradient: 'linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%)',
        lightBg: '#eff6ff',
        accentColor: '#1e40af',
        badgeColor: 'bg-blue-100 text-blue-700',
    },
]

export default function CreateFundingPage()
{
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [type, setType] = useState<'campaign' | 'project' | null>(null)
    const [coverFile, setCoverFile] = useState<UploadedFile | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<Step2Data>({
        resolver: zodResolver(step2Schema),
        defaultValues: { title: '', description: '', goal_amount: undefined as any, deadline: '' },
    })
    const { register, watch, trigger, formState: { errors } } = form
    const titleLen = (watch('title') ?? '').length
    const descLen = (watch('description') ?? '').length

    const selectedType = TYPE_OPTIONS.find(o => o.val === type)

    async function next()
    {
        if (step === 0) { if (!type) { toast.error('Please select a type'); return }; setStep(1) }
        else if (step === 1) { const ok = await trigger(); if (ok) setStep(2) }
        else if (step === 2) setStep(3)
    }

    async function submit()
    {
        const v = form.getValues()
        if (!type) return
        setSubmitting(true)
        try
        {
            const { id } = await createCampaign({
                type,
                title: v.title,
                description: v.description,
                goal_amount: v.goal_amount,
                deadline: v.deadline,
                cover_url: coverFile?.secure_url ?? null,
            })
            toast.success('Campaign created!')
            router.push(`/app/funding/${id}`)
        } catch (e: any) { toast.error(e?.message ?? 'Failed'); setSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Hero header ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.15),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 max-w-2xl mx-auto px-5 pt-6 pb-8">
                    <Link href="/app/funding"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-green-300/70 hover:text-green-300 transition-colors mb-4">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Funding
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            {type === 'project' ? <Rocket className="w-6 h-6 text-white" /> : type === 'campaign' ? <Megaphone className="w-6 h-6 text-white" /> : <Lightbulb className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-0.5">HubNovo Funding</p>
                            <h1 className="text-2xl font-black text-white leading-tight">
                                {type === 'project' ? 'Create a Project' : type === 'campaign' ? 'Start a Campaign' : 'Create a Campaign'}
                            </h1>
                            <p className="text-sm text-green-300/60 mt-0.5">Raise funds for a cause or community project</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

                {/* ── Step indicator ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex items-center gap-1">
                    {STEPS.map((s, i) =>
                    {
                        const done = step > s.id
                        const active = step === s.id
                        return (
                            <div key={s.id}
                                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all',
                                    active ? 'text-white' : done ? 'text-emerald-700' : 'text-gray-400'
                                )}
                                style={active ? { background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' } : {}}>
                                {done
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    : <s.icon className="w-3.5 h-3.5 shrink-0" />
                                }
                                <span>{s.label}</span>
                            </div>
                        )
                    })}
                </div>

                {/* ── Step 0 — Type selection ── */}
                {step === 0 && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <h2 className="text-lg font-black text-gray-900">What are you creating?</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Choose the type that fits your goal</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {TYPE_OPTIONS.map(opt => (
                                <button key={opt.val} type="button" onClick={() => setType(opt.val)}
                                    className={cn('relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200',
                                        type === opt.val
                                            ? 'border-transparent shadow-lg scale-[1.01]'
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                    )}>
                                    {/* Gradient header */}
                                    <div className="px-5 pt-5 pb-4 relative"
                                        style={type === opt.val ? { background: opt.gradient } : { background: opt.lightBg }}>
                                        {type === opt.val && (
                                            <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
                                                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                                        )}
                                        <div className="flex items-start justify-between mb-3 relative z-10">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: type === opt.val ? 'rgba(255,255,255,0.2)' : 'white', border: type === opt.val ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e5e7eb' }}>
                                                <opt.icon className="w-6 h-6" style={{ color: type === opt.val ? 'white' : opt.accentColor }} />
                                            </div>
                                            {type === opt.val && (
                                                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative z-10">
                                            <p className={cn('font-black text-lg', type === opt.val ? 'text-white' : 'text-gray-900')}>{opt.title}</p>
                                            <p className={cn('text-xs font-semibold', type === opt.val ? 'text-white/70' : 'text-gray-500')}>{opt.subtitle}</p>
                                        </div>
                                    </div>
                                    {/* Card body */}
                                    <div className="px-5 py-4 bg-white space-y-3">
                                        <p className="text-sm text-gray-600 leading-relaxed">{opt.desc}</p>
                                        <div className="space-y-1.5">
                                            {opt.features.map(f => (
                                                <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                        <div className={cn('text-[10px] font-black px-2.5 py-1 rounded-full w-fit uppercase tracking-wider', opt.badgeColor)}>
                                            {opt.val}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 1 — Details ── */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50"
                            style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: selectedType?.gradient ?? 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                    {(() => { const TypeIcon = selectedType?.icon ?? Megaphone; return <TypeIcon className="w-5 h-5 text-white" /> })()}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">Campaign Details</h2>
                                    <p className="text-xs text-gray-500">Tell people what you&apos;re raising for</p>
                                </div>
                                <span className={cn('ml-auto text-[10px] font-black px-2 py-0.5 rounded-full uppercase', selectedType?.badgeColor ?? 'bg-emerald-100 text-emerald-700')}>
                                    {type}
                                </span>
                            </div>
                        </div>
                        <div className="px-5 py-5 space-y-5">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="title" className="text-sm font-bold text-gray-800">
                                        Title <span className="text-red-500">*</span>
                                    </Label>
                                    <span className={cn('text-xs', titleLen > 80 ? 'text-red-500' : 'text-gray-400')}>{titleLen}/100</span>
                                </div>
                                <Input id="title" placeholder="Give your campaign a clear, compelling title"
                                    {...register('title')}
                                    className={cn('rounded-xl border-gray-200 focus:border-emerald-400 text-black text-sm', errors.title ? 'border-red-300 bg-red-50' : '')} />
                                {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errors.title.message}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="description" className="text-sm font-bold text-gray-800">Description</Label>
                                    <span className={cn('text-xs', descLen > 4500 ? 'text-red-500' : 'text-gray-400')}>{descLen}/5000</span>
                                </div>
                                <Textarea id="description" rows={5}
                                    placeholder="Tell your story — why you're raising funds, how they'll be used, and what impact they'll make"
                                    {...register('description')}
                                    className="rounded-xl border-gray-200 focus:border-emerald-400 text-black text-sm resize-none" />
                            </div>

                            {/* Goal + Deadline grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="goal_amount" className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5 text-emerald-600" /> Goal Amount <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-700">₦</span>
                                        <Input id="goal_amount" type="number" min={1000} placeholder="50,000"
                                            className={cn('pl-8 rounded-xl border-gray-200 focus:border-emerald-400 text-black font-bold', errors.goal_amount ? 'border-red-300 bg-red-50' : '')}
                                            {...register('goal_amount', { valueAsNumber: true })} />
                                    </div>
                                    {errors.goal_amount && <p className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle className="w-3 h-3" /> {errors.goal_amount.message}</p>}
                                    <p className="text-[11px] text-gray-400">Minimum ₦1,000</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="deadline" className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Deadline <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="deadline" type="date"
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                        className={cn('rounded-xl border-gray-200 focus:border-emerald-400 text-black', errors.deadline ? 'border-red-300 bg-red-50' : '')}
                                        {...register('deadline')} />
                                    {errors.deadline && <p className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle className="w-3 h-3" /> {errors.deadline.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2 — Cover image ── */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50"
                            style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">Cover Image</h2>
                                    <p className="text-xs text-gray-500">Optional — but a strong image boosts donations</p>
                                </div>
                                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Optional</span>
                            </div>
                        </div>
                        <div className="px-5 py-5 space-y-4">
                            {coverFile ? (
                                <div className="space-y-3">
                                    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200"
                                        style={{ aspectRatio: '16/7' }}>
                                        <Image src={coverFile.secure_url} alt="Cover" fill className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 672px" />
                                        <div className="absolute inset-0 flex items-end p-3"
                                            style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)' }}>
                                            <span className="flex items-center gap-1 text-white text-xs font-bold"><Check className="w-3.5 h-3.5" /> Cover uploaded</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setCoverFile(null)}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                                        Remove & upload different image
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-gray-200 text-black p-4">
                                    <MediaUploader maxImages={1} maxVideos={0}
                                        onUploadComplete={files => { if (files[0]) setCoverFile(files[0]) }} />
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400 text-black rounded-xl px-4 py-3">
                                <Lightbulb className="w-4 h-4 shrink-0" />
                                <span>Recommended size: 1200×630px. You can skip this and add a cover later.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 3 — Review ── */}
                {step === 3 && (
                    <div className="space-y-4">
                        {/* Cover preview */}
                        {coverFile && (
                            <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100"
                                style={{ aspectRatio: '16/7' }}>
                                <Image src={coverFile.secure_url} alt="Cover" fill className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 672px" />
                                <div className="absolute inset-0 flex items-end p-4"
                                    style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }}>
                                    <div>
                                        <p className="text-white font-black text-lg leading-tight">{form.getValues('title')}</p>
                                        <p className="text-white/70 text-xs mt-0.5 capitalize">{type} · ₦{form.getValues('goal_amount')?.toLocaleString('en-NG')} goal</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50"
                                style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Eye className="w-4 h-4 text-emerald-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900">Review Your Campaign</h2>
                                        <p className="text-xs text-gray-500">Everything look good? Submit to go live.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[
                                    { label: 'Type', icon: Pin, value: <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-full uppercase', selectedType?.badgeColor ?? 'bg-emerald-100 text-emerald-700')}>{type}</span> },
                                    { label: 'Title', icon: PenLine, value: <span className="font-bold text-gray-900 text-sm">{form.getValues('title')}</span> },
                                    { label: 'Description', icon: FileText, value: form.getValues('description') ? <span className="text-gray-600 text-sm line-clamp-3">{form.getValues('description')}</span> : <span className="text-gray-400 text-sm italic">Not provided</span> },
                                    { label: 'Goal', icon: Target, value: <span className="font-black text-emerald-700 text-base">₦{form.getValues('goal_amount')?.toLocaleString('en-NG')}</span> },
                                    { label: 'Deadline', icon: Calendar, value: <span className="font-bold text-gray-800 text-sm">{form.getValues('deadline') ? new Date(form.getValues('deadline')).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span> },
                                    { label: 'Cover', icon: ImageIcon, value: coverFile ? <span className="flex items-center gap-1 text-emerald-700 font-bold text-sm"><Check className="w-3.5 h-3.5" /> Image uploaded</span> : <span className="text-gray-400 text-sm">No cover image</span> },
                                ].map(row => (
                                    <div key={row.label} className="flex items-start gap-3 px-5 py-3.5">
                                        <row.icon className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-400 w-24 shrink-0 pt-0.5">{row.label}</span>
                                        <div className="flex-1">{row.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Launch note */}
                        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                            <Rocket className="w-5 h-5 shrink-0 text-emerald-600" />
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Your campaign will go live immediately after submission. Share it with your network to start receiving donations!
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Navigation buttons ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
                    <button
                        onClick={() => step > 0 && setStep(s => s - 1)}
                        disabled={step === 0 || submitting}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:text-black disabled:opacity-40 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="flex items-center gap-2">
                        {STEPS.map((s) => (
                            <div key={s.id} className={cn('w-2 h-2 rounded-full transition-all',
                                step === s.id ? 'bg-emerald-600 w-6' : step > s.id ? 'bg-emerald-300' : 'bg-gray-200'
                            )} />
                        ))}
                    </div>

                    {step < 3 ? (
                        <button
                            onClick={next}
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            {step === 2 ? 'Review' : 'Continue'} <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={submit}
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                                : <><Rocket className="w-4 h-4" /> Launch Campaign</>
                            }
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
