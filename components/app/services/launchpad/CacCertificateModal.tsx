'use client'

import React, { useRef } from 'react'
import { X, Download, Printer, ShieldCheck, CheckCircle2, Award } from 'lucide-react'
import type { CacApplication, BusinessProfile } from '@/lib/types'
import { toast } from '@/components/toast'

interface CacCertificateModalProps {
    isOpen: boolean
    onClose: () => void
    application: CacApplication | null
    business: BusinessProfile | null
}

export default function CacCertificateModal({
    isOpen,
    onClose,
    application,
    business,
}: CacCertificateModalProps) {
    const certRef = useRef<HTMLDivElement>(null)

    if (!isOpen || !application) return null

    const businessName = application.proposed_name_1 || business?.name || 'HUBNOVO ENTERPRISE'
    const regNumber = application.cac_registration_number || 'BN 3892104'
    const registrationDate = application.approved_at
        ? new Date(application.approved_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '28th September 2026'

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        toast.success(`Official CAC Certificate for ${businessName} prepared for download!`)
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header Actions Bar */}
                <div className="px-6 py-3.5 border-b border-border/80 flex items-center justify-between bg-muted/40">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-foreground">
                            Official Digital CAC Registration Certificate
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            {regNumber}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Print Certificate"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Certificate View */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/20 flex justify-center">
                    <div
                        ref={certRef}
                        className="w-full max-w-2xl bg-[#fdfbf7] text-slate-900 border-[6px] border-double border-[#b4975a] p-6 sm:p-10 rounded-sm shadow-xl relative overflow-hidden select-none font-serif"
                    >
                        {/* Decorative Guilloche Watermark */}
                        <div className="absolute inset-0 opacity-[0.035] pointer-events-none flex items-center justify-center">
                            <Award className="w-[450px] h-[450px] text-[#008751]" />
                        </div>

                        {/* Top Coat of Arms Emblem & Header */}
                        <div className="text-center space-y-1 relative z-10 border-b-2 border-[#b4975a]/30 pb-4">
                            <div className="w-16 h-16 mx-auto mb-2 relative flex items-center justify-center">
                                {/* Nigerian Coat of Arms stylization */}
                                <div className="w-14 h-14 rounded-full border-2 border-[#008751] flex items-center justify-center bg-white shadow-xs">
                                    <ShieldCheck className="w-9 h-9 text-[#008751]" />
                                </div>
                            </div>

                            <p className="text-[11px] font-sans tracking-[0.25em] text-slate-700 font-bold uppercase">
                                Federal Republic of Nigeria
                            </p>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-serif">
                                CORPORATE AFFAIRS COMMISSION
                            </h2>
                            <p className="text-[10px] sm:text-xs italic text-slate-600">
                                (Established under the Companies and Allied Matters Act, 2020)
                            </p>
                        </div>

                        {/* Certificate Title */}
                        <div className="text-center my-6 relative z-10">
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-sans font-semibold">
                                Certificate of Registration of
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#008751] tracking-wide mt-1 uppercase font-serif drop-shadow-xs">
                                Business Name
                            </h1>
                            <div className="w-24 h-0.5 bg-[#b4975a] mx-auto mt-2" />
                        </div>

                        {/* Body Wording */}
                        <div className="space-y-4 text-center text-xs sm:text-sm text-slate-800 leading-relaxed relative z-10">
                            <p className="italic">
                                I hereby certify that the business name:
                            </p>

                            <div className="py-2.5 px-4 bg-emerald-50/60 border border-[#b4975a]/40 rounded-lg inline-block max-w-full">
                                <span className="text-base sm:text-xl font-black tracking-wider text-slate-950 uppercase font-serif">
                                    {businessName}
                                </span>
                            </div>

                            <p>
                                was registered pursuant to and in accordance with the provisions of Part C of the
                                <strong> Companies and Allied Matters Act, 2020</strong> as an enterprise carrying on business as:
                            </p>

                            <p className="font-semibold text-slate-900 italic max-w-lg mx-auto">
                                "{application.business_nature || business?.description || 'Commercial enterprise and allied services'}"
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-3 text-left max-w-md mx-auto text-xs font-sans">
                                <div>
                                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                        Proprietor:
                                    </span>
                                    <span className="font-bold text-slate-900 block truncate">
                                        {application.proprietor_full_name || 'Sole Proprietor'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                        Principal Address:
                                    </span>
                                    <span className="font-bold text-slate-900 block truncate">
                                        {application.business_address}, {application.business_state}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Seal & Signatures */}
                        <div className="mt-8 pt-6 border-t-2 border-[#b4975a]/30 grid grid-cols-3 items-end text-center relative z-10 font-sans text-xs">
                            {/* Left: Registration Number */}
                            <div className="text-left">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                                    Registration No:
                                </span>
                                <span className="font-mono text-sm sm:text-base font-black text-slate-950 tracking-wider">
                                    {regNumber}
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-1">
                                    Date: {registrationDate}
                                </span>
                            </div>

                            {/* Middle: Gold Foil CAC Seal */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-full border-2 border-[#b4975a] bg-gradient-to-br from-[#d4af37] via-[#f3e5ab] to-[#aa771c] shadow-md flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full border border-dashed border-[#855810] flex flex-col items-center justify-center text-[7px] font-black uppercase text-[#4a350e] leading-none text-center">
                                        <span>Official</span>
                                        <Award className="w-4 h-4 my-0.5 text-[#5e3e0c]" />
                                        <span>CAC Seal</span>
                                    </div>
                                </div>
                                <span className="text-[9px] text-[#008751] font-bold mt-1.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Verified Digital</span>
                                </span>
                            </div>

                            {/* Right: Registrar General */}
                            <div className="text-right">
                                <div className="w-24 h-8 border-b border-slate-900/60 ml-auto mb-1 flex items-end justify-center">
                                    <span className="font-serif italic text-xs text-slate-600 select-none">
                                        H. Bello (SAN)
                                    </span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-700 block">
                                    Registrar-General
                                </span>
                                <span className="text-[9px] text-slate-500 block">
                                    Corporate Affairs Commission
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
