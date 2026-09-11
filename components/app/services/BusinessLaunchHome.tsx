// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import Image from 'next/image'
// import
// {
//     PiggyBank, Settings2, FileText, ShoppingCart,
//     Plus, ChevronRight, CheckCircle2, Clock,
//     Package, Filter, Star, Shield,
//     Briefcase, TrendingUp, Users,
// } from 'lucide-react'
// import type { ServiceWithProvider } from '@/lib/types'
// import AddListingModal from './AddListingModal'

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function fmt(n: number)
// {
//     return `₦${n.toLocaleString('en-NG')}`
// }

// // ─── Circular progress arc ────────────────────────────────────────────────────

// function CircularProgress({ pct, size = 140 }: { pct: number; size?: number })
// {
//     const r = (size - 20) / 2
//     const circ = 2 * Math.PI * r
//     const dash = (pct / 100) * circ
//     return (
//         <svg width={size} height={size} className="-rotate-90">
//             <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={10} />
//             <circle cx={size / 2} cy={size / 2} r={r} fill="none"
//                 stroke="url(#goldGrad)" strokeWidth={10}
//                 strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
//             <defs>
//                 <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
//                     <stop offset="0%" stopColor="#d4a017" />
//                     <stop offset="100%" stopColor="#f0c040" />
//                 </linearGradient>
//             </defs>
//         </svg>
//     )
// }

// // ─── Equipment categories ─────────────────────────────────────────────────────

// const EQUIP_CATS = ['All Equipment', 'Sewing Machines', 'Generators', 'POS Devices', 'Freezers', 'TVs']

// const EQUIP_CAT_KEYS: Record<string, string> = {
//     'Sewing Machines': 'sewing', 'Generators': 'generator',
//     'POS Devices': 'pos', 'Freezers': 'freezer', 'TVs': 'tv',
// }

// // ─── Business services config ─────────────────────────────────────────────────

// const BIZ_SERVICES = [
//     { key: 'cac', label: 'CAC Registration', icon: FileText, status: 'In Progress', color: 'bg-blue-50 text-blue-700' },
//     { key: 'bp', label: 'Business Plan', icon: TrendingUp, status: 'Drafting', color: 'bg-amber-50 text-amber-700' },
//     { key: 'tax', label: 'Tax Clearance (TCC)', icon: Shield, status: 'Pending', color: 'bg-gray-50 text-gray-600' },
//     { key: 'mkt', label: 'Marketing Support', icon: Users, status: 'Unlock at Day 30', color: 'bg-gray-50 text-gray-400', locked: true },
// ]

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface Props
// {
//     displayName: string
//     services: ServiceWithProvider[]
//     myServices: { id: string; title: string; category: string; active: boolean; created_at: string }[]
//     savedAmount: number
//     savingsGoal: number
//     daysSaved: number
//     totalDays: number
//     applicationsCount: number
//     formalizedCount: number
// }

// // ─── Main component ───────────────────────────────────────────────────────────

// export default function BusinessLaunchHome({
//     displayName, services, myServices,
//     savedAmount, savingsGoal, daysSaved, totalDays,
//     applicationsCount, formalizedCount,
// }: Props)
// {
//     const router = useRouter()
//     const [activeEquipCat, setActiveEquipCat] = useState('All Equipment')
//     const [addListingOpen, setAddListingOpen] = useState(false)
//     const [selectedService, setSelectedService] = useState<ServiceWithProvider | null>(null)

//     const savePct = savingsGoal > 0 ? Math.min(100, Math.round((savedAmount / savingsGoal) * 100)) : 0
//     const daysPct = totalDays > 0 ? Math.min(100, Math.round((daysSaved / totalDays) * 100)) : 0
//     const hasGoal = savingsGoal > 0

//     // Filter equipment by category keyword
//     const filtered = activeEquipCat === 'All Equipment'
//         ? services
//         : services.filter(s =>
//             s.category.toLowerCase().includes(EQUIP_CAT_KEYS[activeEquipCat] ?? activeEquipCat.toLowerCase()) ||
//             s.title.toLowerCase().includes((EQUIP_CAT_KEYS[activeEquipCat] ?? '').toLowerCase())
//         )

//     return (
//         <div className="bg-[#f0f2f5] min-h-screen">

//             {/* ══════════════════════════════════════════════
//                 HERO — dark green, full width
//             ══════════════════════════════════════════════ */}
//             <div className="relative overflow-hidden"
//                 style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
//                 {/* Grid overlay */}
//                 <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
//                     style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
//                 {/* Glow blobs */}
//                 <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
//                     style={{ background: 'radial-gradient(circle,#4ade80,transparent 70%)' }} />

//                 <div className="relative z-10 px-5 pt-6 pb-8 max-w-2xl mx-auto">
//                     <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-3">HubNovo</p>

//                     <div className="flex items-end justify-between gap-4">
//                         <div className="flex-1">
//                             <h1 className="text-3xl font-black text-white leading-tight">
//                                 Launch Your<br />
//                                 Business Today
//                             </h1>
//                             <p className="text-yellow-300 font-bold text-base mt-1">
//                                 — Save, Apply, Grow! 🚀
//                             </p>
//                             <p className="text-green-300/70 text-sm mt-1">Welcome, {displayName}</p>
//                         </div>
//                         {/* Hero image — large, no border, overflows bottom of hero */}
//                         <div className="relative shrink-0 w-40 h-44 sm:w-52 sm:h-56 self-end">
//                             <Image
//                                 src="/naiaj_imact_img.png"
//                                 alt="Launch your business"
//                                 fill
//                                 className="object-contain object-bottom drop-shadow-lg"
//                                 priority
//                             />
//                         </div>
//                     </div>

//                     {/* 4-tile quick actions */}
//                     <div className="grid grid-cols-2 gap-3 mt-6">
//                         {[
//                             { icon: PiggyBank, label: 'Start Saving', href: '/app/fintech/safe' },
//                             { icon: Settings2, label: 'Apply for Equipment', href: '#equipment' },
//                             { icon: FileText, label: 'Get Formalized (CAC/Tax)', href: '#formalize' },
//                             { icon: ShoppingCart, label: 'Shop on Plans', href: '#shop' },
//                         ].map(({ icon: Icon, label, href }) => (
//                             <a key={label} href={href}
//                                 className="flex flex-col gap-3 p-4 rounded-2xl border border-white/15 hover:bg-white/10 transition-all group"
//                                 style={{ background: 'rgba(255,255,255,0.07)' }}>
//                                 <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
//                                     <Icon className="w-5 h-5 text-white" />
//                                 </div>
//                                 <div className="flex items-end justify-between">
//                                     <span className="text-white text-xs font-semibold leading-tight flex-1">{label}</span>
//                                     <span className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold text-green-800 bg-white/90 shrink-0">
//                                         Go
//                                     </span>
//                                 </div>
//                             </a>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* ══════════════════════════════════════════════
//                 SCROLLABLE CONTENT
//             ══════════════════════════════════════════════ */}
//             <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">

//                 {/* ── Progress stats 3-col ── */}
//                 <div className="grid grid-cols-3 gap-3">
//                     {/* Savings */}
//                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
//                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Your Progress</p>
//                         <p className="text-xl font-black text-gray-900">~{fmt(savedAmount)}</p>
//                         <p className="text-[11px] text-gray-500 mt-0.5">Saved</p>
//                         <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
//                             <div className="h-full rounded-full bg-green-500" style={{ width: `${savePct}%` }} />
//                         </div>
//                     </div>

//                     {/* Applications */}
//                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
//                         <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-2">
//                             <Package className="w-5 h-5 text-gray-400" />
//                         </div>
//                         <p className="text-2xl font-black text-gray-900">{applicationsCount}</p>
//                         <p className="text-[11px] text-gray-500 mt-0.5">Applications</p>
//                         <p className="text-[10px] text-green-600 font-bold">{savePct}%</p>
//                         <div className="mt-1.5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
//                             <div className="h-full rounded-full bg-green-500" style={{ width: `${savePct}%` }} />
//                         </div>
//                     </div>

//                     {/* Formalized */}
//                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
//                         <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-2">
//                             <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
//                         </div>
//                         <p className="text-2xl font-black text-gray-900">{formalizedCount}</p>
//                         <p className="text-[11px] text-gray-500 mt-0.5">Formalized</p>
//                         <p className="text-[10px] text-green-600 font-bold">{daysPct}%</p>
//                         <div className="mt-1.5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
//                             <div className="h-full rounded-full bg-yellow-400" style={{ width: `${daysPct}%` }} />
//                         </div>
//                     </div>
//                 </div>

//                 {/* ── Cooperative Savings challenge ── */}
//                 <div className="rounded-3xl overflow-hidden shadow-sm"
//                     style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
//                     <div className="px-5 pt-5 pb-6">
//                         <div className="flex items-center justify-between mb-1">
//                             <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Cooperative Savings</p>
//                             <span className="text-[11px] font-bold text-yellow-300">
//                                 {daysSaved}/{totalDays} DAYS SAVED
//                             </span>
//                         </div>
//                         <p className="text-white/60 text-xs mb-4">
//                             Goal: {fmt(savingsGoal)} | Saved: {fmt(savedAmount)}
//                         </p>

//                         {/* Circular progress / empty state */}
//                         <div className="flex items-center justify-center mb-4">
//                             {hasGoal ? (
//                                 <div className="relative">
//                                     <CircularProgress pct={daysPct} size={150} />
//                                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
//                                         <span className="text-3xl font-black">{daysPct}%</span>
//                                         <span className="text-[10px] text-green-300/70 text-center px-4 leading-tight">
//                                             1-Month Business<br />Seed Savings Goal
//                                         </span>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="flex flex-col items-center gap-3 py-2">
//                                     <div className="relative">
//                                         <CircularProgress pct={0} size={150} />
//                                         <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
//                                             <span className="text-3xl font-black">0%</span>
//                                             <span className="text-[10px] text-green-300/70 text-center px-4 leading-tight">
//                                                 Start your<br />savings goal
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <a href="/app/fintech/safe"
//                                         className="px-5 py-2 rounded-xl text-xs font-bold text-green-900 bg-yellow-300 hover:bg-yellow-200 transition-colors">
//                                         Create a Savings Goal →
//                                     </a>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Business Launch Services 2x2 */}
//                         <div id="formalize">
//                             <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-3">
//                                 Business Launch Services
//                             </p>
//                             <div className="grid grid-cols-2 gap-3">
//                                 {BIZ_SERVICES.map(({ key, label, icon: Icon, status, color, locked }) => (
//                                     <div key={key}
//                                         className={`rounded-2xl p-4 border border-white/10 ${locked ? 'opacity-50' : ''}`}
//                                         style={{ background: 'rgba(255,255,255,0.07)' }}>
//                                         <div className="flex items-center gap-2 mb-2">
//                                             <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
//                                                 <Icon className="w-4 h-4 text-white" />
//                                             </div>
//                                             {locked && <span className="text-yellow-300 text-xs">🔒</span>}
//                                         </div>
//                                         <p className="text-white text-xs font-bold leading-tight">{label}</p>
//                                         <p className={`text-[10px] mt-1 font-semibold px-1.5 py-0.5 rounded-full w-fit ${color}`}>
//                                             Status: {status}
//                                         </p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* ── Equipment & Appliances ── */}
//                 <section id="equipment">
//                     <div className="flex items-center justify-between mb-3">
//                         <div>
//                             <h2 className="font-bold text-gray-900">Equipment & Appliances</h2>
//                             <p className="text-xs text-gray-500">Payment plans available</p>
//                         </div>
//                         <button onClick={() => setAddListingOpen(true)}
//                             className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
//                             style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
//                             <Plus className="w-4 h-4" /> Add Listing
//                         </button>
//                     </div>

//                     {/* Category chips */}
//                     <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mb-4">
//                         {EQUIP_CATS.map(cat => (
//                             <button key={cat} onClick={() => setActiveEquipCat(cat)}
//                                 className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${activeEquipCat === cat
//                                     ? 'bg-green-700 text-white border-green-700'
//                                     : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
//                                     }`}>
//                                 {cat}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Equipment grid */}
//                     {filtered.length === 0 ? (
//                         <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
//                             <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
//                             <p className="font-semibold text-gray-600">No listings yet</p>
//                             <p className="text-sm text-gray-400 mt-1">Be the first to add equipment</p>
//                             <button onClick={() => setAddListingOpen(true)}
//                                 className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white mx-auto transition-all hover:opacity-90"
//                                 style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
//                                 <Plus className="w-4 h-4" /> Add Listing
//                             </button>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//                             {filtered.map(svc =>
//                             {
//                                 const minPrice = svc.pricing_tiers?.length
//                                     ? Math.min(...svc.pricing_tiers.map(t => t.price))
//                                     : 0
//                                 return (
//                                     <div key={svc.id}
//                                         onClick={() => setSelectedService(svc)}
//                                         className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer hover:border-green-300 hover:shadow-md transition-all group">
//                                         {/* Image */}
//                                         <div className="relative aspect-square bg-gray-50">
//                                             {svc.cover_url ? (
//                                                 <Image src={svc.cover_url} alt={svc.title} fill
//                                                     className="object-cover" sizes="200px" />
//                                             ) : (
//                                                 <div className="absolute inset-0 flex items-center justify-center">
//                                                     <Package className="w-8 h-8 text-gray-200" />
//                                                 </div>
//                                             )}
//                                             {/* Category badge */}
//                                             <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-yellow-900">
//                                                 {svc.category}
//                                             </span>
//                                         </div>
//                                         {/* Card body */}
//                                         <div className="p-3">
//                                             <p className="text-xs font-bold text-gray-800 truncate">{svc.title}</p>
//                                             {minPrice > 0 && (
//                                                 <p className="text-xs font-black text-gray-900 mt-0.5">{fmt(minPrice)}</p>
//                                             )}
//                                             <button
//                                                 onClick={e => { e.stopPropagation(); router.push(`/app/services/${svc.id}`) }}
//                                                 className="mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold text-white transition-colors"
//                                                 style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
//                                                 Apply Now
//                                             </button>
//                                         </div>
//                                     </div>
//                                 )
//                             })}
//                         </div>
//                     )}
//                 </section>

//                 {/* ── My Listings ── */}
//                 {myServices.length > 0 && (
//                     <section>
//                         <div className="flex items-center justify-between mb-3">
//                             <h2 className="font-bold text-gray-900">My Listings</h2>
//                             <Link href="/app/services/create"
//                                 className="text-xs font-bold text-green-700 flex items-center gap-0.5">
//                                 Add new <ChevronRight className="w-3.5 h-3.5" />
//                             </Link>
//                         </div>
//                         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
//                             {myServices.map(s => (
//                                 <Link key={s.id} href={`/app/services/${s.id}`}
//                                     className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
//                                     <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
//                                         <Package className="w-4 h-4 text-green-700" />
//                                     </div>
//                                     <div className="flex-1 min-w-0">
//                                         <p className="text-sm font-bold text-gray-800 truncate">{s.title}</p>
//                                         <p className="text-[11px] text-gray-400">{s.category}</p>
//                                     </div>
//                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
//                                         }`}>
//                                         {s.active ? 'Active' : 'Inactive'}
//                                     </span>
//                                 </Link>
//                             ))}
//                         </div>
//                     </section>
//                 )}

//                 <div className="h-4" />
//             </div>

//             {/* ── Modals ── */}
//             <AddListingModal open={addListingOpen} onOpenChange={setAddListingOpen} />

//             {/* Equipment detail modal */}
//             {selectedService && (
//                 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
//                     onClick={() => setSelectedService(null)}>
//                     <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
//                         onClick={e => e.stopPropagation()}>
//                         {selectedService.cover_url && (
//                             <div className="relative h-48 bg-gray-50">
//                                 <Image src={selectedService.cover_url} alt={selectedService.title}
//                                     fill className="object-cover" sizes="400px" />
//                                 <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
//                                     {selectedService.category}
//                                 </span>
//                             </div>
//                         )}
//                         <div className="p-5 space-y-3">
//                             <h3 className="font-black text-gray-900 text-lg">{selectedService.title}</h3>
//                             {selectedService.description && (
//                                 <p className="text-sm text-gray-500 line-clamp-3">{selectedService.description}</p>
//                             )}
//                             {selectedService.pricing_tiers?.length > 0 && (
//                                 <div className="space-y-1.5">
//                                     {selectedService.pricing_tiers.map((t, i) => (
//                                         <div key={i} className="flex justify-between text-sm">
//                                             <span className="text-gray-600">{t.label || `Plan ${i + 1}`}</span>
//                                             <span className="font-bold text-gray-900">{fmt(t.price)}</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                             <div className="flex items-center gap-2 text-xs text-gray-500">
//                                 <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
//                                 <span>Trusted Seller</span>
//                                 <CheckCircle2 className="w-3.5 h-3.5 text-green-600 ml-2" />
//                                 <span>100% Verified</span>
//                             </div>
//                             <button className="w-full py-3 rounded-2xl text-sm font-black text-white mt-1 transition-all hover:opacity-90"
//                                 style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}
//                                 onClick={() =>
//                                 {
//                                     router.push(`/app/services/${selectedService.id}`)
//                                     setSelectedService(null)
//                                 }}>
//                                 Apply Now
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }
'use client'

import { Hourglass } from 'lucide-react'

export default function BusinessLaunchPage() {
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
                        Business Launch is Coming Soon
                    </h1>

                    {/* Description */}
                    <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500 dark:text-gray-400">
                        We&apos;re preparing something impactful.
                        Soon, you&apos;ll be able to save, access business
                        equipment, get your business formalized, and grow
                        your business with HubNovo.
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