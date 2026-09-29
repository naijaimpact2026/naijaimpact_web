'use client'

import React, { useState, useEffect } from 'react'
import {
    X,
    Sparkles,
    Building2,
    MapPin,
    Tag,
    FileText,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Palette,
    Check,
} from 'lucide-react'
import { saveBusinessProfile, type SaveBusinessInput } from '@/lib/actions/launchpad'
import type { BusinessProfile } from '@/lib/types'
import { toast } from '@/components/toast'

interface BusinessProfileModalProps {
    isOpen: boolean
    onClose: () => void
    existingBusiness?: BusinessProfile | null
    onSaved: (business: BusinessProfile) => void
    onProceedToCac?: () => void
}

const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const CATEGORIES = [
    { label: 'Agriculture & Agribusiness', icon: '🌾' },
    { label: 'Food, Catering & Restaurants', icon: '🍲' },
    { label: 'Fashion, Apparel & Beauty', icon: '👗' },
    { label: 'Tech, Software & Digital Services', icon: '💻' },
    { label: 'Retail & E-commerce', icon: '🛍️' },
    { label: 'Creative, Media & Entertainment', icon: '🎨' },
    { label: 'Health, Wellness & Pharmacy', icon: '🏥' },
    { label: 'Education, Training & Coaching', icon: '📚' },
    { label: 'Logistics, Delivery & Transport', icon: '🚚' },
    { label: 'Artisan, Trades & Construction', icon: '🔨' },
    { label: 'Professional & Financial Services', icon: '💼' },
    { label: 'Other Enterprise', icon: '🚀' },
]

const LOGO_PALETTES = [
    { id: 'emerald', bg: 'from-emerald-500 to-teal-700', text: 'text-white', border: 'border-emerald-400/50' },
    { id: 'ocean', bg: 'from-blue-600 to-cyan-500', text: 'text-white', border: 'border-cyan-400/50' },
    { id: 'amber', bg: 'from-amber-500 to-orange-600', text: 'text-white', border: 'border-amber-400/50' },
    { id: 'purple', bg: 'from-purple-600 to-pink-600', text: 'text-white', border: 'border-purple-400/50' },
    { id: 'slate', bg: 'from-slate-800 to-zinc-950', text: 'text-emerald-400', border: 'border-zinc-700' },
]

export default function BusinessProfileModal({
    isOpen,
    onClose,
    existingBusiness,
    onSaved,
    onProceedToCac,
}: BusinessProfileModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [loading, setLoading] = useState(false)

    // Form fields
    const [name, setName] = useState('')
    const [tagline, setTagline] = useState('')
    const [category, setCategory] = useState(CATEGORIES[0].label)
    const [locationState, setLocationState] = useState('Lagos')
    const [locationCity, setLocationCity] = useState('')
    const [description, setDescription] = useState('')
    const [selectedPalette, setSelectedPalette] = useState(LOGO_PALETTES[0].id)

    // Populate existing business if editing
    useEffect(() => {
        if (existingBusiness) {
            setName(existingBusiness.name || '')
            setTagline(existingBusiness.tagline || '')
            setCategory(existingBusiness.category || CATEGORIES[0].label)
            setLocationState(existingBusiness.location_state || 'Lagos')
            setLocationCity(existingBusiness.location_city || '')
            setDescription(existingBusiness.description || '')
        }
    }, [existingBusiness])

    if (!isOpen) return null

    // Generate initials for logo preview
    const initials = name
        ? name
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'HN'

    const activeColor = LOGO_PALETTES.find((p) => p.id === selectedPalette) || LOGO_PALETTES[0]

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Please enter a business name')
            setStep(1)
            return
        }

        setLoading(true)
        try {
            const input: SaveBusinessInput = {
                id: existingBusiness?.id,
                name,
                tagline,
                category,
                location_state: locationState,
                location_city: locationCity,
                description,
                logo_url: `palette:${selectedPalette}`,
            }

            const res = await saveBusinessProfile(input)
            if (!res.success) {
                toast.error(res.error || 'Failed to save business profile')
                return
            }

            toast.success('Business profile saved successfully!')
            onSaved(res.data)
            onClose()
            if (onProceedToCac) {
                onProceedToCac()
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-border/80 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-foreground">
                                    {existingBusiness ? 'Edit Business Profile' : 'Step 1: Set Up Business Profile'}
                                </h2>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Done in 3 mins
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Establish your enterprise presence in Nigeria's digital economy.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Tabs */}
                <div className="grid grid-cols-3 border-b border-border/80 bg-muted/15 text-xs font-semibold">
                    <button
                        onClick={() => setStep(1)}
                        className={`py-2.5 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                            step === 1
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">1</span>
                        <span>Name & Industry</span>
                    </button>
                    <button
                        onClick={() => setStep(2)}
                        className={`py-2.5 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                            step === 2
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">2</span>
                        <span>Location & Bio</span>
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        className={`py-2.5 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                            step === 3
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">3</span>
                        <span>Branding & Preview</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                    {/* ── STEP 1: Name & Category ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Business Name *</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. DaniFoods Enterprises, TechBridge Africa"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    This will also be used in Step 2 for CAC corporate name reservation.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Business Tagline (Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    placeholder="e.g. Farm-fresh organic produce delivered to your kitchen"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Select Industry Sector *</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = category === cat.label
                                        return (
                                            <button
                                                type="button"
                                                key={cat.label}
                                                onClick={() => setCategory(cat.label)}
                                                className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 shadow-xs'
                                                        : 'border-border/80 hover:border-emerald-500/40 hover:bg-muted/40 text-foreground'
                                                }`}
                                            >
                                                <span className="text-base shrink-0">{cat.icon}</span>
                                                <span className="truncate">{cat.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-500 shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Location & Description ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Operational State *</span>
                                    </label>
                                    <select
                                        value={locationState}
                                        onChange={(e) => setLocationState(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
                                    >
                                        {NIGERIAN_STATES.map((st) => (
                                            <option key={st} value={st}>
                                                {st}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5">
                                        City / Town / LGA
                                    </label>
                                    <input
                                        type="text"
                                        value={locationCity}
                                        onChange={(e) => setLocationCity(e.target.value)}
                                        placeholder="e.g. Ikeja, Lekki, Wuse II, Ibadan"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>About the Business & Operations</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe what your business does, who your customers are, and the problem you solve..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60 resize-none"
                                />
                                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>Be clear and concise for potential customers and investors.</span>
                                    <span>{description.length}/500</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Branding & Live Card Preview ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>AI Logo Monogram Palette</span>
                                </label>
                                <div className="grid grid-cols-5 gap-2.5">
                                    {LOGO_PALETTES.map((p) => {
                                        const isSelected = selectedPalette === p.id
                                        return (
                                            <button
                                                type="button"
                                                key={p.id}
                                                onClick={() => setSelectedPalette(p.id)}
                                                className={`h-12 rounded-xl bg-gradient-to-br ${p.bg} flex items-center justify-center font-bold text-sm text-white shadow-xs transition-all cursor-pointer relative ${
                                                    isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105' : 'opacity-80 hover:opacity-100'
                                                }`}
                                            >
                                                {initials}
                                                {isSelected && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Live Card Preview */}
                            <div>
                                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    Live Preview: Your Digital Business Card
                                </span>
                                <div className="p-4 sm:p-5 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeColor.bg} ${activeColor.border} border-2 flex items-center justify-center font-black text-xl shadow-lg shrink-0 ${activeColor.text}`}
                                        >
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                                                    {name || 'Your Business Name'}
                                                </h3>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    Registered Pending
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                                {tagline || 'Your compelling business tagline goes here.'}
                                            </p>
                                            <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-500" />
                                                    <span>{locationCity ? `${locationCity}, ` : ''}{locationState}</span>
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="w-3 h-3 text-emerald-500" />
                                                    <span>{category}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {description && (
                                        <div className="mt-3.5 pt-3 border-t border-border/60 text-xs text-foreground/80 leading-relaxed">
                                            {description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-border/80 flex items-center justify-between bg-muted/20">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep((s) => (s - 1) as any)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-muted-foreground text-xs font-semibold hover:text-foreground transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 1 && !name.trim()) {
                                    toast.error('Please enter a business name to proceed')
                                    return
                                }
                                setStep((s) => (s + 1) as any)
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                        >
                            <span>Next Step</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={loading || !name.trim()}
                            onClick={handleSubmit}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving Profile...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Save & Continue to CAC</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
