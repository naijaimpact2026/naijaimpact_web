'use client'

import { useState } from 'react'
import {
    Users,
    PiggyBank,
    CreditCard,
    TrendingUp,
    ShieldCheck,
    Lock,
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
    icon: typeof Users
    badge?: string
}

const FEATURE_OPTIONS: FeatureOption[] = [
    {
        id: 'ajo_savings',
        title: 'NaijaAjo Rotating Savings',
        desc: 'Automated cooperative thrift groups with scheduled, transparent cycle payouts.',
        icon: Users,
        badge: 'Community',
    },
    {
        id: 'safelock_vaults',
        title: 'SafeLock & Goal Vaults',
        desc: 'Disciplined locked savings, goal-targeted deposits, and competitive yields.',
        icon: PiggyBank,
        badge: 'High Yield',
    },
    {
        id: 'wallet_cards',
        title: 'Virtual & Physical Cards',
        desc: 'Instant virtual debit card issuance for online payments and local merchant checkouts.',
        icon: CreditCard,
        badge: 'Everyday Spend',
    },
    {
        id: 'tradecred_loans',
        title: 'TradeCred & Micro-Loans',
        desc: 'Alternative credit scores based on your trade history and fast business credit access.',
        icon: TrendingUp,
        badge: 'Growth Capital',
    },
    {
        id: 'micro_insurance',
        title: 'NaijaInsure Micro-Protection',
        desc: 'Affordable health, equipment, and goods-in-transit loss insurance.',
        icon: ShieldCheck,
        badge: 'Protection',
    },
    {
        id: 'escrow_wallet',
        title: 'Milestone Escrow Settlements',
        desc: 'Zero-risk buyer/seller transactions with instant automated settlement releases.',
        icon: Lock,
        badge: 'Secure Trade',
    },
]

const USE_CASES = [
    { id: 'personal', label: 'Personal Savings & Daily Finance' },
    { id: 'merchant', label: 'Small Business, Trader or Artisan' },
    { id: 'cooperative', label: 'Cooperative, Club or Community Group' },
]

const VOLUME_BRACKETS = [
    'Under ₦50,000 / month',
    '₦50,000 – ₦250,000 / month',
    '₦250,000 – ₦1,000,000 / month',
    'Above ₦1,000,000 / month',
]

interface FeatureInterestFormProps {
    userEmail?: string
    userId?: string
}

export default function FeatureInterestForm({ userEmail = '', userId = '' }: FeatureInterestFormProps) {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
        'ajo_savings',
        'safelock_vaults',
    ])
    const [useCase, setUseCase] = useState<string>('personal')
    const [volume, setVolume] = useState<string>('₦50,000 – ₦250,000 / month')
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
            toast.error('Please select at least one feature you are interested in')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await submitFeatureInterest({
                module: 'saving_wallet',
                features: selectedFeatures,
                useCase,
                monthlyVolume: volume,
                notes: notes.trim(),
                contactEmail: email.trim(),
                notifyOptIn: notifyMe,
            })

            if (res.success) {
                setIsSubmitted(true)
                toast.success('Your feedback has been saved! You are on the early access priority list.')
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
                        You&apos;re on the Early Access Priority List!
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We have recorded your selected features and preferences. You will be among the very first to test and access Hubnovo Saving &amp; Wallet when it launches.
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Feature Demand &amp; Priority Survey</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
                    Which Saving &amp; Wallet features do you need most?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Select the capabilities you want us to roll out first. We actively shape our product roadmap based on your responses.
                </p>
            </div>

            {/* 1. Multi-Select Feature Cards */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-extrabold text-foreground">
                        1. Select All Features of Interest ({selectedFeatures.length} selected)
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

            {/* 2. Primary Intended Use Case */}
            <div className="space-y-3 pt-4 border-t border-border/60">
                <label className="text-sm font-extrabold text-foreground">
                    2. What will you primarily use this for?
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

            {/* 3. Monthly Volume & Open Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border/60">
                <div className="space-y-2">
                    <label className="text-sm font-extrabold text-foreground">
                        3. Estimated Monthly Savings / Inflow
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

            {/* 4. Optional suggestions */}
            <div className="space-y-2 pt-2">
                <label className="text-sm font-extrabold text-foreground">
                    4. Any specific requirements or custom tools you want to see? <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., I need automated weekly debiting for an artisan cooperative of 20 people..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground resize-none"
                />
            </div>

            {/* Submit Action Bar */}
            <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={notifyMe}
                        onChange={(e) => setNotifyMe(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4"
                    />
                    <span>Notify me instantly by email as soon as private beta opens</span>
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Your Input...</span>
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
