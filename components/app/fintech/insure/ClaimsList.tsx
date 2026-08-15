'use client'

import { useState } from 'react'
import { FilePlus, FileText, Clock, CheckCircle2, XCircle, Search, AlertCircle } from 'lucide-react'
import FileClaimModal from './FileClaimModal'
import type { ClaimWithPolicy, PolicyWithProduct } from '@/lib/actions/fintech/insure'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }

const statusCfg: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
    pending: { label: 'Pending', icon: Clock, cls: 'bg-gray-100 text-gray-500' },
    submitted: { label: 'Submitted', icon: Clock, cls: 'bg-sky-100 text-sky-600' },
    under_review: { label: 'Under Review', icon: Search, cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-red-100 text-red-600' },
}

export default function ClaimsList({ claims, activePolicies, onClaimFiled }: {
    claims: ClaimWithPolicy[]
    activePolicies: PolicyWithProduct[]
    onClaimFiled: () => void
})
{
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{claims.length} claim{claims.length !== 1 ? 's' : ''} on record</p>
                <button onClick={() => setModalOpen(true)} disabled={activePolicies.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <FilePlus className="w-4 h-4" /> File Claim
                </button>
            </div>

            {activePolicies.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /> You need an active policy before filing a claim.
                </div>
            )}

            {claims.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 flex flex-col items-center gap-3 text-center">
                    <FileText className="w-10 h-10 text-gray-300" />
                    <p className="font-bold text-gray-600">No claims yet</p>
                    <p className="text-sm text-gray-400">File a claim against any of your active policies.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {claims.map(claim =>
                    {
                        const cfg = statusCfg[claim.status] ?? statusCfg.pending
                        const StatusIcon = cfg.icon
                        return (
                            <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{claim.policy_product_name}</p>
                                            <p className="text-[11px] text-gray-400">#{claim.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${cfg.cls}`}>
                                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{claim.description}</p>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                                    <span>Filed {fmtDate(claim.created_at)}</span>
                                    {claim.document_urls.length > 0 && <span>{claim.document_urls.length} doc{claim.document_urls.length !== 1 ? 's' : ''}</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <FileClaimModal open={modalOpen} onOpenChange={o => { setModalOpen(o); if (!o) onClaimFiled() }}
                activePolicies={activePolicies.map(p => ({ id: p.id, name: p.product_name }))} />
        </div>
    )
}
