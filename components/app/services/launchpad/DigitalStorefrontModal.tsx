'use client'

import React, { useState } from 'react'
import {
    X,
    Store,
    ShieldCheck,
    Sparkles,
    Check,
    ArrowRight,
    Tag,
    Clock,
    Truck,
    Laptop,
    Package,
    AlertCircle,
    Building2,
} from 'lucide-react'
import { createStorefrontListing } from '@/lib/actions/launchpad'
import type { BusinessProfile, CacApplication } from '@/lib/types'
import { toast } from '@/components/toast'

interface DigitalStorefrontModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    cacApplication: CacApplication | null
    onCreated?: (listingData: { id: string; title: string }) => void
    onProceedToNext?: () => void
}

export default function DigitalStorefrontModal({
    isOpen,
    onClose,
    business,
    cacApplication,
    onCreated,
    onProceedToNext,
}: DigitalStorefrontModalProps) {
    const isServiceDefault =
        business?.category?.toLowerCase().includes('tech') ||
        business?.category?.toLowerCase().includes('service') ||
        business?.category?.toLowerCase().includes('creative') ||
        business?.category?.toLowerCase().includes('consult')

    const [listingType, setListingType] = useState<'service' | 'product'>(
        isServiceDefault ? 'service' : 'product'
    )

    const defaultTitle =
        listingType === 'service'
            ? 'Custom Web Application & Software Solutions'
            : 'Software Development Package & Tech Consultation'

    const [title, setTitle] = useState(defaultTitle)
    const [price, setPrice] = useState('150,000')
    const [pricingModel, setPricingModel] = useState<'fixed' | 'starting' | 'milestone'>('starting')
    const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup' | 'nationwide'>('delivery')
    const [escrowEnabled, setEscrowEnabled] = useState(true)
    const [description, setDescription] = useState(
        `Professional ${business?.name || 'enterprise'} software and tech solutions tailored to your business operations. Includes end-to-end architecture, secure API integration, responsive interface, and 30-day post-launch warranty.`
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const suggestedTitles =
        listingType === 'service'
            ? [
                  'Custom Web Application & Software Solutions',
                  'Enterprise IT Consultation & Cloud Setup',
                  'Mobile App UI/UX & Backend Integration',
                  'API Development & Database Optimization',
              ]
            : [
                  'Complete Starter Tech Kit & Workstation Bundle',
                  'Cloud Server Hosting & Domain Deployment Package',
                  'Ready-to-Deploy E-Commerce System',
              ]

    const pricePresets = [50000, 150000, 300000, 500000]

    const parsedPrice = Number(price.replace(/,/g, '')) || 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) {
            toast.error('Business profile is required.')
            return
        }
        if (!title.trim()) {
            toast.error('Please enter a listing title.')
            return
        }
        if (parsedPrice <= 0) {
            toast.error('Please enter a valid price in Naira.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createStorefrontListing({
                business_id: business.id,
                title: title.trim(),
                description: description.trim(),
                listing_type: listingType,
                price: parsedPrice,
                category: business.category,
                delivery_option: deliveryOption,
                escrow_enabled: escrowEnabled,
            })

            if (res.success) {
                toast.success('🎉 Digital Storefront listing published on NaijaMarket!')
                setIsSuccess(true)
                onCreated?.(res.data)
            } else {
                toast.error(res.error || 'Failed to publish listing')
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl text-foreground">
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    Step 3 of 7
                                </span>
                                {cacApplication?.cac_registration_number && (
                                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        {cacApplication.cac_registration_number}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                                Create Your Digital Storefront
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    /* ── Success Screen ── */
                    <div className="p-6 sm:p-8 text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">
                                Storefront Listing Live!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                <span className="font-semibold text-foreground">{title}</span> is now active on NaijaMarket with verified Hubnovo badge for{' '}
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {business?.name}
                                </span>
                                .
                            </p>
                        </div>

                        {/* Live Card Preview */}
                        <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border text-left space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                                    {listingType} Listing
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Hubnovo Verified Seller
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{title}</h4>
                            <div className="flex items-baseline justify-between pt-2 border-t border-border/60">
                                <span className="text-xs text-muted-foreground">Price</span>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    ₦{parsedPrice.toLocaleString('en-NG')}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                View Later
                            </button>
                            <button
                                onClick={() => {
                                    onClose()
                                    onProceedToNext?.()
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Step 4 (Savings Goal)</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form Screen ── */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                        {/* Info banner */}
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Verified Merchant Privilege:</span>{' '}
                                Because <span className="font-bold text-foreground">{business?.name || 'your business'}</span> is Hubnovo registered, your storefront listings receive priority ranking on NaijaMarket and the official Hubnovo verified shield.
                            </div>
                        </div>

                        {/* Listing Type Tabs */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Listing Type</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setListingType('service')
                                        setTitle('Custom Web Application & Software Solutions')
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        listingType === 'service'
                                            ? 'bg-card text-foreground shadow-xs border border-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Laptop className="w-4 h-4 text-emerald-500" />
                                    <span>Professional Service</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setListingType('product')
                                        setTitle('Software Development Package & Tech Consultation')
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        listingType === 'product'
                                            ? 'bg-card text-foreground shadow-xs border border-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Package className="w-4 h-4 text-emerald-500" />
                                    <span>Physical / Packaged Product</span>
                                </button>
                            </div>
                        </div>

                        {/* Title & Suggested Chips */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">
                                Offering Title <span className="text-emerald-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Custom Web Application Development"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                required
                            />
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-muted-foreground font-semibold">Quick Suggestions:</span>
                                {suggestedTitles.map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setTitle(st)}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price & Presets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">
                                    Price (₦ NGN) <span className="text-emerald-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                        ₦
                                    </span>
                                    <input
                                        type="text"
                                        value={price}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '')
                                            setPrice(val ? Number(val).toLocaleString('en-NG') : '')
                                        }}
                                        placeholder="150,000"
                                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                    {pricePresets.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPrice(p.toLocaleString('en-NG'))}
                                            className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium cursor-pointer"
                                        >
                                            ₦{p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}k`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Pricing Structure</label>
                                <select
                                    value={pricingModel}
                                    onChange={(e) => setPricingModel(e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                >
                                    <option value="starting">Starting From (Custom scope)</option>
                                    <option value="fixed">Fixed Price (Package deal)</option>
                                    <option value="milestone">Milestone / Retainer</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Deliverables & Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="Describe what clients or buyers will receive..."
                            />
                        </div>

                        {/* Delivery & Escrow Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Fulfillment</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={deliveryOption}
                                        onChange={(e) => setDeliveryOption(e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                    >
                                        <option value="delivery">Remote / Direct Delivery</option>
                                        <option value="pickup">Physical Pickup (Ikeja, Lagos)</option>
                                        <option value="nationwide">Nationwide Dispatch</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        Hubnovo Escrow
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Funds released upon milestone approval.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={escrowEnabled}
                                    onChange={(e) => setEscrowEnabled(e.target.checked)}
                                    className="w-4 h-4 text-emerald-500 rounded border-border focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                        <span>Publishing to NaijaMarket...</span>
                                    </>
                                ) : (
                                    <>
                                        <Store className="w-4 h-4" />
                                        <span>Publish Digital Storefront</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
