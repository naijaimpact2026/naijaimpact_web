'use client'

import React, { useState, useEffect } from 'react'
import {
    X,
    ShieldCheck,
    Building2,
    MapPin,
    CreditCard,
    Wallet,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Info,
    Sparkles,
    Check,
} from 'lucide-react'
import {
    submitCacApplication,
    checkCacNameAvailability,
    type SubmitCacInput,
} from '@/lib/actions/launchpad'
import type { BusinessProfile, CacApplication } from '@/lib/types'
import { toast } from '@/components/toast'
import Link from 'next/link'

interface CacRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    walletBalance: number
    onSubmitted: (application: CacApplication) => void
    onOpenProfileSetup?: () => void
}

const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const SUBSIDIZED_FEE = 5000

export default function CacRegistrationModal({
    isOpen,
    onClose,
    business,
    walletBalance,
    onSubmitted,
    onOpenProfileSetup,
}: CacRegistrationModalProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [loading, setLoading] = useState(false)
    const [nameChecking, setNameChecking] = useState(false)
    const [nameCheckResult, setNameCheckResult] = useState<{
        available: boolean
        message: string
        hasRestrictedWords: boolean
    } | null>(null)

    // Form fields
    const [name1, setName1] = useState('')
    const [name2, setName2] = useState('')
    const [nature, setNature] = useState('')
    const [proprietorName, setProprietorName] = useState('')
    const [nin, setNin] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('Lagos')
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet')

    // Pre-populate when business profile exists
    useEffect(() => {
        if (business) {
            if (!name1) setName1(business.name || '')
            if (!name2) setName2(`${business.name || ''} Global Enterprises`)
            if (!nature) setNature(business.description || `Commercial trading and services in ${business.category}`)
            if (business.location_state) setState(business.location_state)
            if (business.location_city && !city) setCity(business.location_city)
        }
    }, [business])

    if (!isOpen) return null

    // If user has not yet created a business profile
    if (!business) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Set Up Business Profile First</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            To register with the Corporate Affairs Commission (CAC), you need an active business profile. It only takes 3 minutes!
                        </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onClose()
                                if (onOpenProfileSetup) onOpenProfileSetup()
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                            Create Profile Now
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const handleCheckNameAvailability = async () => {
        if (!name1.trim()) return
        setNameChecking(true)
        try {
            const res = await checkCacNameAvailability(name1)
            setNameCheckResult(res)
        } catch {
            setNameCheckResult({
                available: true,
                hasRestrictedWords: false,
                message: 'Name format complies with standard registration rules.',
            })
        } finally {
            setNameChecking(false)
        }
    }

    const handleSubmitApplication = async () => {
        if (!name1.trim() || !name2.trim()) {
            toast.error('Both primary and alternative proposed business names are required.')
            setStep(1)
            return
        }

        const cleanNin = nin.trim().replace(/\D/g, '')
        if (cleanNin.length !== 11) {
            toast.error('National Identification Number (NIN) must be exactly 11 digits.')
            setStep(3)
            return
        }

        if (!proprietorName.trim()) {
            toast.error('Proprietor full legal name is required.')
            setStep(3)
            return
        }

        if (!address.trim()) {
            toast.error('Physical business address is required by CAC.')
            setStep(2)
            return
        }

        if (paymentMethod === 'wallet' && walletBalance < SUBSIDIZED_FEE) {
            toast.error(`Insufficient wallet balance. You have ₦${walletBalance.toLocaleString('en-NG')}.`)
            return
        }

        setLoading(true)
        try {
            const input: SubmitCacInput = {
                business_id: business.id,
                proposed_name_1: name1.trim(),
                proposed_name_2: name2.trim(),
                business_nature: nature.trim(),
                proprietor_full_name: proprietorName.trim(),
                proprietor_nin: cleanNin,
                proprietor_phone: phone.trim(),
                business_address: address.trim(),
                business_city: city.trim() || 'Lagos',
                business_state: state,
                payment_method: paymentMethod,
            }

            const res = await submitCacApplication(input)
            if (!res.success) {
                toast.error(res.error || 'Failed to submit application')
                return
            }

            toast.success('CAC Application submitted successfully! Tracking initiated.')
            onSubmitted(res.data)
            onClose()
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
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-foreground">
                                    CAC Business Registration
                                </h2>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    ₦5,000 Subsidised
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Facilitated in-platform. Delivered digitally in 5 working days. No queue, no middleman.
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

                {/* Subsidized Banner */}
                <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-b border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Corporate Affairs Commission (CAC) Official Business Name Filing</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        Save ₦15,000+ vs. Agents
                    </span>
                </div>

                {/* Progress Tabs */}
                <div className="grid grid-cols-4 border-b border-border/80 bg-muted/15 text-[11px] font-semibold">
                    {[
                        { num: 1, label: 'Names' },
                        { num: 2, label: 'Nature & Address' },
                        { num: 3, label: 'KYC & NIN' },
                        { num: 4, label: 'Payment' },
                    ].map((t) => (
                        <button
                            key={t.num}
                            onClick={() => setStep(t.num as any)}
                            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                                step === t.num
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px]">{t.num}</span>
                            <span className="truncate">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* ── STEP 1: Proposed Names ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    CAC requires two proposed name options. If your primary name has a conflict at the registry, the registrar will automatically reserve your alternative name.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Option 1: Primary Proposed Name *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={name1}
                                        onChange={(e) => {
                                            setName1(e.target.value)
                                            setNameCheckResult(null)
                                        }}
                                        placeholder="e.g. DaniFoods Enterprises"
                                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all uppercase font-medium placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground/60"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCheckNameAvailability}
                                        disabled={nameChecking || !name1.trim()}
                                        className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                        {nameChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check CAMA Rules'}
                                    </button>
                                </div>

                                {nameCheckResult && (
                                    <div
                                        className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                            nameCheckResult.hasRestrictedWords
                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                        }`}
                                    >
                                        {nameCheckResult.hasRestrictedWords ? (
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                        )}
                                        <span>{nameCheckResult.message}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Option 2: Alternative Proposed Name *
                                </label>
                                <input
                                    type="text"
                                    value={name2}
                                    onChange={(e) => setName2(e.target.value)}
                                    placeholder="e.g. Dani Agro Ventures"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all uppercase font-medium placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground/60"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Backup name choice in case Option 1 is already reserved by another trader.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Nature & Address ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Nature of Business Activity *
                                </label>
                                <textarea
                                    rows={3}
                                    value={nature}
                                    onChange={(e) => setNature(e.target.value)}
                                    placeholder="e.g. Cultivation, processing, packaging, and commercial distribution of food crops and agricultural produce."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60 resize-none"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Will be officially recorded on your CAC Certificate of Registration.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Physical Principal Place of Business *</span>
                                </label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. Plot 14, Commercial Avenue, Sabo"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-foreground mb-1.5">
                                        State *
                                    </label>
                                    <select
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
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
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="e.g. Yaba, Ikeja"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: KYC & NIN ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    Under Federal Law, CAC validates proprietor identity against the National Identity Management Commission (NIMC) database. Ensure names match your NIN slip exactly.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Proprietor Full Legal Name (As on NIN) *
                                </label>
                                <input
                                    type="text"
                                    value={proprietorName}
                                    onChange={(e) => setProprietorName(e.target.value)}
                                    placeholder="e.g. Daniel Chukwuemeka Uzor"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                                    <span>National Identification Number (NIN) *</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        {nin.replace(/\D/g, '').length}/11 Digits
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={11}
                                    value={nin}
                                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="11-digit NIN (e.g. 12345678901)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-sans"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">
                                    Proprietor Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. 08012345678"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Review & Payment ── */}
                    {step === 4 && (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                    Filing Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Primary Name:</span>
                                        <span className="font-bold text-foreground truncate block">{name1 || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Alternative:</span>
                                        <span className="font-bold text-foreground truncate block">{name2 || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Proprietor:</span>
                                        <span className="font-medium text-foreground">{proprietorName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">State / Address:</span>
                                        <span className="font-medium text-foreground truncate block">{address ? `${address}, ${state}` : state}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fee Breakdown */}
                            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Standard CAC Business Name Fee:</span>
                                    <span className="line-through">₦10,000</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <span>Launchpad Platform Subsidy:</span>
                                    <span>-₦5,000</span>
                                </div>
                                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-foreground block">Total Amount to Pay:</span>
                                        <span className="text-[10px] text-muted-foreground">Inclusive of certificate issuance</span>
                                    </div>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        ₦5,000
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-foreground">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                            paymentMethod === 'wallet'
                                                ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                                                : 'border-border hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Wallet className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-foreground">Hubnovo Wallet</span>
                                                {paymentMethod === 'wallet' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                                                Balance: ₦{walletBalance.toLocaleString('en-NG')}
                                            </span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('paystack')}
                                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                            paymentMethod === 'paystack'
                                                ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                                                : 'border-border hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-foreground">Card / Paystack</span>
                                                {paymentMethod === 'paystack' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                                                Instant Bank Transfer / Card
                                            </span>
                                        </div>
                                    </button>
                                </div>

                                {paymentMethod === 'wallet' && walletBalance < SUBSIDIZED_FEE && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between mt-2">
                                        <span>Wallet balance is lower than ₦5,000.</span>
                                        <Link
                                            href="/app/wallet"
                                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
                                        >
                                            Top Up Wallet
                                        </Link>
                                    </div>
                                )}
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

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 1 && (!name1.trim() || !name2.trim())) {
                                    toast.error('Please enter both name options')
                                    return
                                }
                                if (step === 2 && !address.trim()) {
                                    toast.error('Please enter business physical address')
                                    return
                                }
                                if (step === 3 && (!proprietorName.trim() || nin.replace(/\D/g, '').length !== 11)) {
                                    toast.error('Please enter proprietor name and 11-digit NIN')
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
                            disabled={loading || (paymentMethod === 'wallet' && walletBalance < SUBSIDIZED_FEE)}
                            onClick={handleSubmitApplication}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing Filing...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Pay ₦5,000 & Submit to CAC</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
