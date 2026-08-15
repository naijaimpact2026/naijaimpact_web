'use client'

import { Shield, CalendarDays, Heart, Smartphone, Plane, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { PolicyWithProduct } from '@/lib/actions/fintech/insure'

function fmtNGN(n: number) { return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    health: Heart, device: Smartphone, travel: Plane, life: Shield,
}
const categoryIconCls: Record<string, string> = {
    health: 'bg-red-100 text-red-600', device: 'bg-blue-100 text-blue-600',
    travel: 'bg-sky-100 text-sky-600', life: 'bg-teal-100 text-teal-600',
}
const statusCfg: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
    active: { label: 'Active', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
    expired: { label: 'Expired', icon: Clock, cls: 'bg-gray-100 text-gray-500' },
    cancelled: { label: 'Cancelled', icon: XCircle, cls: 'bg-red-100 text-red-600' },
}

export default function PolicyCard({ policy }: { policy: PolicyWithProduct })
{
    const Icon = categoryIcons[policy.product_category] ?? Shield
    const iconCls = categoryIconCls[policy.product_category] ?? 'bg-teal-100 text-teal-600'
    const status = statusCfg[policy.status] ?? statusCfg.expired
    const StatusIcon = status.icon

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{policy.product_name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{policy.product_category} insurance</p>
                    </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>
                    <StatusIcon className="w-3 h-3" /> {status.label}
                </span>
            </div>
            <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] text-gray-400">Coverage</p>
                        <p className="text-base font-black text-gray-900">{fmtNGN(policy.coverage_amount)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400">Policy ID</p>
                        <p className="font-mono text-xs text-gray-500">{policy.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    {fmtDate(policy.start_date)} – {fmtDate(policy.end_date)}
                </div>
            </div>
        </div>
    )
}
