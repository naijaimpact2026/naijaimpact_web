'use client'

import { useState } from 'react'
import {
    HeartHandshake,
    Rocket,
    ShieldCheck,
    Gift,
    Receipt,
    Building2,
    CheckCircle2,
    Sparkles,
    Send,
    Loader2,
    Check,
} from 'lucide-react'
import { submitFeatureInterest } from '@/lib/actions/featureInterest'
import { toast } from 'sonner'

interface FeatureOption {
    id: string
    title: string
    desc: string
    icon: typeof HeartHandshake
    badge?: string
}

const FEATURE_OPTIONS: FeatureOption[] = [
    {
        id: 'grassroots_causes',
        title: 'Grassroots Community Causes',
        desc: 'Direct backing for community boreholes, rural clinic supplies, and local school rehabilitation.',
        icon: HeartHandshake,
        badge: 'Social Impact',
    },
    {
        id: 'startup_innovation',
        title: 'Innovator & Startup Backing',
        desc: 'Early-stage crowdfunding for Nigerian tech, agritech, and creative production ventures.',
        icon: Rocket,
        badge: 'Enterprise',
    },
    {
        id: 'milestone_escrow',
        title: 'Milestone-Protected Disbursements',
        desc: 'Funds held in escrow and released only upon verified milestone execution proof.',
        icon: ShieldCheck,
        badge: 'Zero Fraud',
    },
    {
        id: 'backer_perks',
        title: 'Backer Rewards & Perks',
        desc: 'Early product access, branded merchandise, VIP community roles, and founder access.',
        icon: Gift,
        badge: 'Rewards',
    },
    {
        id: 'transparent_receipts',
        title: 'Real-Time Ledger & Receipts',
        desc: 'Instant transparent audit logs, verifiable donor receipts, and campaign updates.',
        icon: Receipt,
        badge: 'Transparency',
    },
    {
        id: 'matched_grants',
        title: 'Foundation & Corporate Match',
        desc: '1:1 funding matches from partner NGOs, CSR funds, and diaspora philanthropic syndicates.',
        icon: Building2,
        badge: 'Multiplier',
    },
]

const USE_CASES = [
    { id: 'backer', label: 'I want to donate and back impactful Nigerian projects' },
    { id: 'creator', label: 'I want to launch a campaign for my cause or project' },
    { id: 'ngo_sponsor', label: 'I represent an NGO, foundation, or CSR sponsor' },
]

const VOLUME_BRACKETS = [
    'Under ₦100,000 target',
    '₦100,000 – ₦1,000,000 target',
    '₦1,000,000 – ₦10,000,000 target',
    'Above ₦10,000,000 target',
]

interface CrowdfundingInterestFormProps {
    userEmail?: string
    userId?: string
}

export default function CrowdfundingInterestForm({ userEmail = '', userId = '' }: CrowdfundingInterestFormProps) {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
        'grassroots_causes',
        'milestone_escrow',
    ])
    const [useCase, setUseCase] = useState<string>('backer')
    const [volume, setVolume] = useState<string>('₦100,000 – ₦1,000,000 target')
    const [email, setEmail] = useState<string>(userEmail)
    const [notes, setNotes] = useState<string>('')
    const [notifyMe, setNotifyMe] = useState<boolean>(true)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    function toggleFeature(id: string) {
        setSelectedFeatures((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (selectedFeatures.length === 0) {
            toast.error('Please select at least one crowdfunding feature you are interested in')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await submitFeatureInterest({
                module: 'crowdfunding',
                features: selectedFeatures,
                useCase,
                monthlyVolume: volume,
                notes: notes.trim(),
                contactEmail: email.trim(),
                notifyOptIn: notifyMe,
            })

            if (res.success) {
                setIsSubmitted(true)
                toast.success('Your crowdfunding interest has been recorded! Thank you for helping shape Hubnovo.')
            } else {
                toast.error(res.message || 'Submission failed. Please try again.')
            }
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="rounded-3xl border border-primary/20 bg-card p-8 sm:p-12 text-center shadow-xl space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="h-9 w-9" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="font-display text-2xl font-black text-foreground">
                        You&apos;re on the Crowdfunding Early Access List!
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We have recorded your campaign interests and feature preferences. You will receive priority notifications when the crowdfunding engine opens.
                    </p>
                </div>

                <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-2">
                    {selectedFeatures.map((fid) => {
                        const match = FEATURE_OPTIONS.find((f) => f.id === fid)
                        if (!match) return null
                        return (
                            <span
                                key={fid}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                            >
                                <Check className="w-3.5 h-3.5" />
                                {match.title}
                            </span>
                        )
                    })}
                </div>

                <div className="pt-4">
                    <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                        Update your feedback &amp; preferences
                    </button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-lg space-y-8">
            <div className="space-y-2 border-b border-border/80 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crowdfunding Demand Survey</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
                    What matters most to you in Nigerian Crowdfunding?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Help us build the most trusted fundraising platform in West Africa. Tell us which protections and features you need.
                </p>
            </div>

            {/* 1. Feature Cards Multi-Select */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-extrabold text-foreground">
                        1. Select Features of Interest ({selectedFeatures.length} selected)
                    </label>
                    <span className="text-xs text-muted-foreground font-medium">Click to select/unselect</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {FEATURE_OPTIONS.map((feat) => {
                        const Icon = feat.icon
                        const isSelected = selectedFeatures.includes(feat.id)

                        return (
                            <button
                                key={feat.id}
                                type="button"
                                onClick={() => toggleFeature(feat.id)}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group relative ${
                                    isSelected
                                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40'
                                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/40'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted text-muted-foreground group-hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {feat.badge && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                                {feat.badge}
                                            </span>
                                        )}
                                        <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'border-border bg-background'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                        {feat.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                                        {feat.desc}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 2. Primary Intent */}
            <div className="space-y-3 pt-4 border-t border-border/60">
                <label className="text-sm font-extrabold text-foreground">
                    2. How do you plan to participate?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {USE_CASES.map((uc) => (
                        <button
                            key={uc.id}
                            type="button"
                            onClick={() => setUseCase(uc.id)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                                useCase === uc.id
                                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                                    : 'border-border text-foreground hover:bg-muted/50'
                            }`}
                        >
                            <span>{uc.label}</span>
                            {useCase === uc.id && <Check className="w-3.5 h-3.5 shrink-0 text-primary ml-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Campaign / Donation Target Range & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border/60">
                <div className="space-y-2">
                    <label className="text-sm font-extrabold text-foreground">
                        3. Target Campaign / Contribution Scope
                    </label>
                    <select
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        {VOLUME_BRACKETS.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-extrabold text-foreground">
                        Your Contact Email for Launch Notification
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* 4. Notes */}
            <div className="space-y-2 pt-2">
                <label className="text-sm font-extrabold text-foreground">
                    4. Tell us about a cause or project you want to fund or launch <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., We want to fund solar power for a community health clinic in Ogun State..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground resize-none"
                />
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={notifyMe}
                        onChange={(e) => setNotifyMe(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4"
                    />
                    <span>Notify me as soon as Crowdfunding opens for public submissions</span>
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Recording Preferences...</span>
                        </>
                    ) : (
                        <>
                            <span>Join Waitlist &amp; Submit Preferences</span>
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
