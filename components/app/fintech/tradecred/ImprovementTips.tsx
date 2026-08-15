'use client'

import { Lightbulb, PiggyBank, ArrowLeftRight, Users, ShoppingBag, UserPlus, GraduationCap, CheckCircle2 } from 'lucide-react'
import type { ScoreCategory } from '@/lib/actions/fintech/tradecred'

const TIPS: Record<ScoreCategory, { icon: React.ElementType; title: string; tips: string[]; iconCls: string; barCls: string }> = {
    savings: {
        icon: PiggyBank, title: 'Boost Your Savings', iconCls: 'bg-emerald-100 text-emerald-700', barCls: 'bg-emerald-500',
        tips: ['Set up a flexible savings account and deposit regularly.', 'Create a locked savings plan — longer terms earn better scores.', 'Aim to save at least ₦100,000 across all your accounts.']
    },
    transactions: {
        icon: ArrowLeftRight, title: 'Increase Activity', iconCls: 'bg-sky-100 text-sky-700', barCls: 'bg-sky-500',
        tips: ['Use your NaijaImpact wallet for everyday transactions.', 'Send and receive funds regularly to build financial history.', 'Complete 100+ transactions to reach full marks.']
    },
    cooperative: {
        icon: Users, title: 'Join a Cooperative', iconCls: 'bg-violet-100 text-violet-700', barCls: 'bg-violet-500',
        tips: ['Join or create a NaijaAjo savings group.', 'Contribute consistently every cycle.', 'Being active in 3+ groups earns maximum cooperative score.']
    },
    marketplace: {
        icon: ShoppingBag, title: 'List on Marketplace', iconCls: 'bg-amber-100 text-amber-700', barCls: 'bg-amber-500',
        tips: ['Create a service listing on the marketplace.', 'Keep listings active and updated.', '5+ active listings earns full marketplace points.']
    },
    referral: {
        icon: UserPlus, title: 'Grow Your Network', iconCls: 'bg-pink-100 text-pink-700', barCls: 'bg-pink-500',
        tips: ['Share your profile to attract followers.', 'Engage with posts and communities.', '20+ followers earns the maximum referral score.']
    },
    learning: {
        icon: GraduationCap, title: 'Complete Courses', iconCls: 'bg-orange-100 text-orange-700', barCls: 'bg-orange-500',
        tips: ['Enrol in courses from the NaijaImpact LMS.', 'Complete at least one course to earn learning points.', '5+ completed courses earns full learning score.']
    },
}
const CATEGORY_MAX: Record<ScoreCategory, number> = { savings: 200, transactions: 200, cooperative: 150, marketplace: 150, referral: 150, learning: 150 }

export default function ImprovementTips({ breakdown }: { breakdown: Record<ScoreCategory, number> })
{
    const low = (Object.keys(TIPS) as ScoreCategory[]).filter(c => (breakdown[c] ?? 0) / CATEGORY_MAX[c] < 0.5)

    if (low.length === 0)
    {
        return (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                    <p className="font-bold text-gray-900">All categories performing well!</p>
                    <p className="text-sm text-gray-400 mt-1">Keep up the activity to maintain your TradeCred score.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Improvement Tips</p>
                    <p className="text-[11px] text-gray-400">{low.length} categor{low.length === 1 ? 'y needs' : 'ies need'} attention</p>
                </div>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
                {low.map(cat =>
                {
                    const meta = TIPS[cat]
                    const Icon = meta.icon
                    const pct = Math.round(((breakdown[cat] ?? 0) / CATEGORY_MAX[cat]) * 100)
                    return (
                        <div key={cat} className="bg-gray-50 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconCls}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{meta.title}</p>
                                    <p className="text-[11px] text-gray-400">{pct}% of max</p>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className={`h-full rounded-full ${meta.barCls}`} style={{ width: `${pct}%` }} />
                            </div>
                            <ul className="space-y-1.5">
                                {meta.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                        <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
