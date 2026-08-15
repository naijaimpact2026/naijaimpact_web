'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart2 } from 'lucide-react'
import type { ScoreCategory } from '@/lib/actions/fintech/tradecred'

const CATEGORY_META: Record<ScoreCategory, { label: string; maxPoints: number; color: string; bgCls: string }> = {
    savings: { label: 'Savings', maxPoints: 200, color: '#10b981', bgCls: 'bg-emerald-500' },
    transactions: { label: 'Transactions', maxPoints: 200, color: '#0ea5e9', bgCls: 'bg-sky-500' },
    cooperative: { label: 'Cooperative', maxPoints: 150, color: '#8b5cf6', bgCls: 'bg-violet-500' },
    marketplace: { label: 'Marketplace', maxPoints: 150, color: '#f59e0b', bgCls: 'bg-amber-500' },
    referral: { label: 'Referral', maxPoints: 150, color: '#ec4899', bgCls: 'bg-pink-500' },
    learning: { label: 'Learning', maxPoints: 150, color: '#f97316', bgCls: 'bg-orange-500' },
}

function CustomTooltip({ active, payload, label }: any)
{
    if (!active || !payload?.length) return null
    const v = payload[0].value; const max = payload[0].payload.maxPoints
    return (
        <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
            <p className="font-bold text-gray-900">{label}</p>
            <p className="text-gray-400">{v} / {max} pts ({Math.round((v / max) * 100)}%)</p>
        </div>
    )
}

export default function ScoreBreakdown({ breakdown }: { breakdown: Record<ScoreCategory, number> })
{
    const data = (Object.keys(CATEGORY_META) as ScoreCategory[]).map(cat => ({
        name: CATEGORY_META[cat].label,
        points: breakdown[cat] ?? 0,
        maxPoints: CATEGORY_META[cat].maxPoints,
        pct: Math.round(((breakdown[cat] ?? 0) / CATEGORY_META[cat].maxPoints) * 100),
        color: CATEGORY_META[cat].color,
        bgCls: CATEGORY_META[cat].bgCls,
    }))

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Score Breakdown</p>
                    <p className="text-[11px] text-gray-400">How each category contributes to your score</p>
                </div>
            </div>
            <div className="px-5 pt-4 pb-2">
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart layout="vertical" data={data} margin={{ top: 0, right: 16, bottom: 0, left: 80 }}>
                        <XAxis type="number" domain={[0, 200]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} axisLine={false} width={75} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                        <Bar dataKey="points" radius={[0, 8, 8, 0]} maxBarSize={16}>
                            {data.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {data.map(e => (
                    <div key={e.name} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                        <span className="text-xs text-gray-500 flex-1 truncate">{e.name}</span>
                        <span className="text-xs font-black text-gray-900 ml-auto">{e.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
