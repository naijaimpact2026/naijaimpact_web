'use client'

import React, { useState } from 'react'
import {
    X,
    Megaphone,
    Send,
    Check,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Share2,
    Users,
    MapPin,
    Hash,
} from 'lucide-react'
import { broadcastBusinessLaunch } from '@/lib/actions/launchpad'
import type { BusinessProfile, CacApplication } from '@/lib/types'
import { toast } from '@/components/toast'

interface LaunchAnnouncementModalProps {
    isOpen: boolean
    onClose: () => void
    business: BusinessProfile | null
    cacApplication: CacApplication | null
    onBroadcasted?: (data: { id: string }) => void
    onProceedToNext?: () => void
}

export default function LaunchAnnouncementModal({
    isOpen,
    onClose,
    business,
    cacApplication,
    onBroadcasted,
    onProceedToNext,
}: LaunchAnnouncementModalProps) {
    const businessName = business?.name || 'Our Enterprise'
    const cacNumber = cacApplication?.cac_registration_number || 'BN 3861132'
    const location = `${business?.location_city || 'Ikeja'}, ${business?.location_state || 'Lagos'}`

    const defaultCaption = `🚀 Proud milestone! ${businessName} is officially Hubnovo registered (${cacNumber}) and live on Hubnovo! We offer verified ${business?.category || 'commercial'} solutions based out of ${location}. Check out our digital storefront on NaijaMarket or connect with us for projects. Grateful for this community's support! 🇳🇬✨ #BusinessLaunch #Hubnovo #SME`

    const [caption, setCaption] = useState(defaultCaption)
    const [targetHub, setTargetHub] = useState('Lagos State Entrepreneurs Hub')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const hubs = [
        'Lagos State Entrepreneurs Hub',
        'Tech, Software & Innovation Network',
        'Naija Marketplace Verified Merchants',
        'All-Nigeria Founders Community',
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) {
            toast.error('Business profile is required.')
            return
        }
        if (!caption.trim() || caption.trim().length < 10) {
            toast.error('Announcement must have at least 10 characters.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await broadcastBusinessLaunch({
                business_id: business.id,
                caption: caption.trim(),
                hub: targetHub,
            })

            if (res.success) {
                toast.success('📢 Launch announcement broadcast to the Hubnovo feed!')
                setIsSuccess(true)
                onBroadcasted?.(res.data)
            } else {
                toast.error(res.error || 'Failed to broadcast announcement')
            }
        } catch (err: any) {
            toast.error(err.message || 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl text-foreground">
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                Step 5 of 7
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                                Broadcast Business Launch
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
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center mx-auto border border-purple-500/30">
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">
                                Broadcast Published!
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                Your official launch announcement has been posted to{' '}
                                <span className="font-semibold text-foreground">{targetHub}</span> and the main community feed.
                            </p>
                        </div>

                        {/* Social proof card */}
                        <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border text-left space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                                    {businessName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        {businessName}
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">{location} • Just now</p>
                                </div>
                            </div>
                            <p className="text-xs text-foreground/90 line-clamp-3 italic">
                                &ldquo;{caption}&rdquo;
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    onClose()
                                    onProceedToNext?.()
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Step 6 (CommunityFund)</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form Screen ── */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                        {/* Banner */}
                        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Launch Visibility:</span> Your announcement showcases your verified Hubnovo status badge and direct links to your new digital storefront.
                            </div>
                        </div>

                        {/* Target Hub Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">
                                Broadcast Destination Hub
                            </label>
                            <div className="relative">
                                <select
                                    value={targetHub}
                                    onChange={(e) => setTargetHub(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                                >
                                    {hubs.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Caption Textarea */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-foreground">
                                    Announcement Text
                                </label>
                                <span className="text-[10px] text-muted-foreground">
                                    {caption.length} characters
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 leading-relaxed"
                                required
                            />
                        </div>

                        {/* Interactive Post Card Preview */}
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Live Feed Preview
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-xs shadow-xs">
                                    {businessName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs text-foreground truncate">
                                            {businessName}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            Hubnovo Verified
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {location}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3">
                                {caption}
                            </p>
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
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Publishing Broadcast...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Broadcast to Community</span>
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
