'use client'

import { Shield, Heart, Smartphone, Plane, ArrowRight } from 'lucide-react'
import type { InsureProduct } from '@/lib/types'

function fmtNGN(n: number) { return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; iconCls: string; accentCls: string }> = {
    health: { label: 'Health', icon: Heart, iconCls: 'bg-red-100 text-red-600', accentCls: 'bg-red-600' },
    device: { label: 'Device', icon: Smartphone, iconCls: 'bg-blue-100 text-blue-600', accentCls: 'bg-blue-600' },
    travel: { label: 'Travel', icon: Plane, iconCls: 'bg-sky-100 text-sky-600', accentCls: 'bg-sky-600' },
    life: { label: 'Life', icon: Shield, iconCls: 'bg-teal-100 text-teal-600', accentCls: 'bg-teal-600' },
}

export default function InsureProductCard({ product, onPurchase }: { product: InsureProduct; onPurchase: (p: InsureProduct) => void })
{
    const cfg = categoryConfig[product.category] ?? categoryConfig.life
    const Icon = cfg.icon
    const premium = product.premium_monthly ?? (product as any).monthly_premium ?? 0
    const duration = product.coverage_months ?? (product as any).duration_months ?? 12

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Color top bar */}
            <div className={`h-1.5 ${cfg.accentCls}`} />
            <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconCls}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{product.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 mt-1 inline-block">{cfg.label}</span>
                    </div>
                </div>

                {/* Description */}
                {product.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{product.description}</p>}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Coverage</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">{fmtNGN(product.coverage_amount)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly</p>
                        <p className="text-sm font-black text-teal-700 mt-0.5">{fmtNGN(premium)}</p>
                    </div>
                </div>

                <p className="text-[11px] text-gray-400">Duration: {duration} months · Total: {fmtNGN(premium * duration)}</p>

                {/* CTA */}
                <button onClick={() => onPurchase(product)}
                    className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors">
                    Get Covered <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
