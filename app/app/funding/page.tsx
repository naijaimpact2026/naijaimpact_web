// import Link from 'next/link'
// import { fetchCampaigns } from '@/lib/actions/funding'
// import type { FundingFilter, FundingSort } from '@/lib/actions/funding'
// import FundingList from '@/components/app/funding/FundingList'
// import { Button } from '@/components/ui/button'
// import { PlusCircle, TrendingUp, Users, Zap } from 'lucide-react'
// import { createClient } from '@/lib/supabase/server'

// export const dynamic = 'force-dynamic'

// interface FundingPageProps
// {
//     searchParams: Promise<{ filter?: string; sort?: string }>
// }

// const FILTER_OPTIONS: { value: FundingFilter; label: string; emoji: string }[] = [
//     { value: 'all', label: 'All', emoji: '🌍' },
//     { value: 'campaign', label: 'Campaigns', emoji: '📣' },
//     { value: 'project', label: 'Projects', emoji: '🚀' },
// ]

// const SORT_OPTIONS: { value: FundingSort; label: string }[] = [
//     { value: 'recent', label: 'Most Recent' },
//     { value: 'most_funded', label: 'Most Funded' },
// ]

// async function getFundingStats()
// {
//     const supabase = await createClient()
//     const { data } = await supabase
//         .from('funding')
//         .select('amount_raised, donor_count, status')
//     const active = (data ?? []).filter((c: any) => c.status === 'active')
//     return {
//         totalRaised: active.reduce((s: number, c: any) => s + (c.amount_raised ?? 0), 0),
//         totalDonors: active.reduce((s: number, c: any) => s + (c.donor_count ?? 0), 0),
//         activeCampaigns: active.length,
//     }
// }

// function fmt(n: number)
// {
//     if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
//     if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
//     return `₦${n.toLocaleString('en-NG')}`
// }

// export default async function FundingPage({ searchParams }: FundingPageProps)
// {
//     const params = await searchParams
//     const filter: FundingFilter =
//         params.filter === 'campaign' || params.filter === 'project' ? params.filter : 'all'
//     const sort: FundingSort = params.sort === 'most_funded' ? 'most_funded' : 'recent'

//     // const [{ campaigns: initialCampaigns, nextCursor: initialCursor }, stats] =
//     //     await Promise.all([fetchCampaigns(null, 12, filter, sort), getFundingStats()])

//     // return (
//     //     <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

//             {/* ── Hero ── inline style guarantees background regardless of Tailwind version */}
//             <div
//                 className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
//                 style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0f766e 100%)' }}
//             >
//                 {/* Decorative circles */}
//                 <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20"
//                     style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
//                 <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full opacity-10"
//                     style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />

//                 <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
//                     <div className="space-y-2">
//                         <div className="flex items-center gap-2">
//                             <span className="text-2xl">🌍</span>
//                             <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6ee7b7' }}>
//                                 NaijaImpact Funding
//                             </span>
//                         </div>
//                         <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
//                             Fund the Change<br className="hidden sm:block" /> You Want to See
//                         </h1>
//                         <p className="text-sm max-w-xs" style={{ color: '#a7f3d0' }}>
//                             Support campaigns and projects that move Nigeria forward
//                         </p>
//                     </div>

//                     {/* <Link href="/app/funding/create" className="shrink-0">
//                         <Button
//                             className="gap-2 font-semibold shadow-lg"
//                             style={{ background: '#fff', color: '#064e3b' }}
//                         >
//                             <PlusCircle className="h-4 w-4" />
//                             Start a Campaign
//                         </Button>
//                     </Link> */}
//                 </div>

//                 {/* Stats */}
//                 {/* <div className="relative z-10 mt-6 grid grid-cols-3 gap-4 pt-5"
//                     style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
//                     {[
//                         { icon: TrendingUp, label: 'Total raised', value: fmt(stats.totalRaised) },
//                         { icon: Users, label: 'Donors', value: stats.totalDonors.toLocaleString() },
//                         { icon: Zap, label: 'Active now', value: String(stats.activeCampaigns) },
//                     ].map(({ icon: Icon, label, value }) => (
//                         <div key={label} className="flex flex-col gap-0.5">
//                             <span className="text-xl sm:text-2xl font-bold">{value}</span>
//                             <span className="flex items-center gap-1 text-[11px] sm:text-xs" style={{ color: '#6ee7b7' }}>
//                                 <Icon className="w-3 h-3 shrink-0" /> {label}
//                             </span>
//                         </div>
//                     ))}
//                 </div> */}
//             </div>

//             {/* ── Filter + Sort ── */}
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//                 <div className="flex items-center gap-2 flex-wrap">
//                     {FILTER_OPTIONS.map(({ value, label, emoji }) =>
//                     {
//                         const active = filter === value
//                         return (
//                             <Link key={value} href={`?filter=${value}&sort=${sort}`}>
//                                 <span
//                                     className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border"
//                                     style={active
//                                         ? { background: 'hsl(166,76%,40%)', color: '#fff', borderColor: 'hsl(166,76%,40%)' }
//                                         : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
//                                     }
//                                 >
//                                     {emoji} {label}
//                                 </span>
//                             </Link>
//                         )
//                     })}
//                 </div>

//                 <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1">
//                     {SORT_OPTIONS.map(({ value, label }) =>
//                     {
//                         const active = sort === value
//                         return (
//                             <Link key={value} href={`?filter=${filter}&sort=${value}`}>
//                                 <span
//                                     className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
//                                     style={active
//                                         ? { background: 'hsl(166,76%,40%)', color: '#fff' }
//                                         : { color: '#6b7280' }
//                                     }
//                                 >
//                                     {label}
//                                 </span>
//                             </Link>
//                         )
//                     })}
//                 </div>
//             </div>

//             {/* ── Campaign grid ── */}
//             {/* <FundingList
//                 initialCampaigns={initialCampaigns}
//                 initialCursor={initialCursor}
//                 filter={filter}
//                 sort={sort}
//             /> */}
//         </main>
//     )
// }
'use client'

import { Hourglass } from 'lucide-react'

export default function FundingPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-lg text-center">

                    {/* Hourglass */}
                    <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                        <Hourglass
                            className="h-14 w-14 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={1.5}
                        />
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Funding is Coming Soon
                    </h1>

                    {/* Description */}
                    <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500 dark:text-gray-400">
                        We&apos;re preparing something impactful.
                        Soon, you&apos;ll be able to discover, support,
                        and fund great ideas and projects on NaijaImpact.
                    </p>

                    {/* Status */}
                    <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                        Coming Soon
                    </div>

                </div>
            </div>
        </main>
    )
}