// 'use client'

// import Link from 'next/link'
// import Image from 'next/image'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { Users, Clock } from 'lucide-react'
// import type { CampaignWithCreator } from '@/lib/types'

// function fmt(n: number)
// {
//     if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
//     if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
//     return `₦${n.toLocaleString('en-NG')}`
// }

// function deadlineInfo(d: string)
// {
//     const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
//     if (diff <= 0) return { label: 'Ended', ended: true, urgent: false }
//     if (diff <= 7) return { label: `${diff}d left`, ended: false, urgent: true }
//     return { label: `${diff} days left`, ended: false, urgent: false }
// }

// const TYPE_BG: Record<string, string> = {
//     campaign: 'rgba(139,92,246,0.85)',
//     project: 'rgba(245,158,11,0.85)',
// }

// interface FundingCardProps { campaign: CampaignWithCreator }

// export default function FundingCard({ campaign }: FundingCardProps)
// {
//     const pct = Math.min(100, campaign.goal_amount > 0
//         ? (campaign.amount_raised / campaign.goal_amount) * 100 : 0)
//     const reached = campaign.amount_raised >= campaign.goal_amount
//     const { label: dLabel, ended, urgent } = deadlineInfo(campaign.deadline)

//     return (
//         <Link href={`/app/funding/${campaign.id}`} className="block group focus-visible:outline-none">
//             <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/40">

//                 {/* Cover */}
//                 <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
//                     {campaign.cover_url ? (
//                         <Image src={campaign.cover_url} alt={campaign.title} fill
//                             className="object-cover transition-transform duration-500 group-hover:scale-105"
//                             sizes="(max-width:768px) 100vw,(max-width:1200px) 50vw,33vw" />
//                     ) : (
//                         <div className="absolute inset-0 flex items-center justify-center"
//                             style={{ background: 'linear-gradient(135deg,#065f46,#0f766e)' }}>
//                             <span className="text-5xl opacity-50">🌍</span>
//                         </div>
//                     )}

//                     {/* Scrim */}
//                     <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.35) 0%,transparent 60%)' }} />

//                     {/* Type badge */}
//                     <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
//                         style={{ background: TYPE_BG[campaign.type] ?? 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
//                         {campaign.type === 'campaign' ? '📣' : '🚀'} {campaign.type}
//                     </span>

//                     {/* Goal reached */}
//                     {reached && (
//                         <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
//                             style={{ background: '#16a34a' }}>
//                             🎯 Goal Reached!
//                         </span>
//                     )}

//                     {/* Urgent */}
//                     {urgent && !reached && (
//                         <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white animate-pulse"
//                             style={{ background: '#dc2626' }}>
//                             <Clock className="w-2.5 h-2.5" /> {dLabel}
//                         </span>
//                     )}
//                 </div>

//                 {/* Body */}
//                 <div className="flex flex-col gap-3 p-4 flex-1">
//                     <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
//                         {campaign.title}
//                     </h3>

//                     {/* Creator */}
//                     <div className="flex items-center gap-2">
//                         <Avatar className="h-5 w-5 shrink-0">
//                             <AvatarImage src={campaign.creator.avatar_url ?? undefined} />
//                             <AvatarFallback className="text-[9px] font-bold" style={{ background: 'hsl(166,76%,90%)', color: 'hsl(166,76%,30%)' }}>
//                                 {campaign.creator.username.charAt(0).toUpperCase()}
//                             </AvatarFallback>
//                         </Avatar>
//                         <span className="text-xs text-muted-foreground truncate">@{campaign.creator.username}</span>
//                     </div>

//                     {/* Progress */}
//                     <div className="space-y-2 mt-auto">
//                         <div className="flex items-end justify-between gap-1">
//                             <div>
//                                 <p className="text-base font-bold text-foreground leading-none">{fmt(campaign.amount_raised)}</p>
//                                 <p className="text-[11px] text-muted-foreground mt-0.5">of {fmt(campaign.goal_amount)}</p>
//                             </div>
//                             <span className="text-sm font-bold" style={{ color: reached ? '#16a34a' : 'hsl(166,76%,40%)' }}>
//                                 {pct.toFixed(0)}%
//                             </span>
//                         </div>

//                         {/* Bar */}
//                         <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
//                             <div className="h-full rounded-full transition-all duration-700"
//                                 style={{
//                                     width: `${pct}%`,
//                                     background: reached
//                                         ? '#16a34a'
//                                         : 'linear-gradient(to right, hsl(166,76%,40%), hsl(199,100%,43%))',
//                                 }} />
//                         </div>

//                         {/* Footer */}
//                         <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground"
//                             style={{ borderTop: '1px solid #f3f4f6' }}>
//                             <span className="flex items-center gap-1">
//                                 <Users className="w-3 h-3" /> {campaign.donor_count.toLocaleString()} donors
//                             </span>
//                             {!urgent && (
//                                 <span style={ended ? { color: '#dc2626', fontWeight: 600 } : {}}>
//                                     {dLabel}
//                                 </span>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Bottom hover bar */}
//                 <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
//                     style={{ background: 'linear-gradient(to right, hsl(166,76%,40%), hsl(199,100%,43%))' }} />
//             </div>
//         </Link>
//     )
// }
