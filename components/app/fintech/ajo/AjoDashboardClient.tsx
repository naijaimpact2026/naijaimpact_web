'use client'

import { useState } from 'react'
import { Users2, PlusCircle, LogIn, Calendar, AlertTriangle, ChevronRight, TrendingUp, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CreateAjoGroupForm from './CreateAjoGroupForm'
import JoinAjoGroupForm from './JoinAjoGroupForm'
import ContributionPrompt from './ContributionPrompt'
import DisputeModal from './DisputeModal'
import type { AjoGroupWithMembership, PendingContribution, UpcomingPayout, OpenDispute } from '@/app/app/fintech/ajo/page'

function fmtNGN(n: number) { return `₦${n.toLocaleString('en-NG')}` }
function fmtDate(d: string)
{
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
function freqLabel(f: string) { return ({ weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' })[f] ?? f }

interface AjoDashboardClientProps
{
    groups: AjoGroupWithMembership[]
    pendingContributions: PendingContribution[]
    upcomingPayouts: UpcomingPayout[]
    openDisputes: OpenDispute[]
    currentUserId: string
}

export default function AjoDashboardClient({ groups, pendingContributions, upcomingPayouts, openDisputes }: AjoDashboardClientProps)
{
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [disputeGroup, setDisputeGroup] = useState<{ id: string; name: string } | null>(null)

    const totalCollected = groups.reduce((s, g) => s + (g.total_collected ?? 0), 0)

    return (
        <div className="space-y-5">
            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Active Groups', value: groups.length, icon: Users2, cls: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Total Collected', value: fmtNGN(totalCollected), icon: TrendingUp, cls: 'bg-sky-100 text-sky-700' },
                    { label: 'Pending', value: pendingContributions.length, icon: Clock, cls: 'bg-amber-100 text-amber-700' },
                ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-gray-900">{value}</p>
                            <p className="text-[11px] text-gray-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-3">
                <button onClick={() => setShowCreate(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Create Group
                </button>
                <button onClick={() => setShowJoin(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                    <LogIn className="w-4 h-4" /> Join Group
                </button>
            </div>

            {/* ── Pending Contributions ── */}
            {pendingContributions.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Contributions</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{pendingContributions.length}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {pendingContributions.map(c => (
                            <ContributionPrompt key={`${c.groupId}-${c.cycle}`} groupName={c.groupName} groupId={c.groupId} memberId={c.memberId} cycle={c.cycle} amount={c.amount} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Upcoming Payouts ── */}
            {upcomingPayouts.length > 0 && (
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Upcoming Payouts</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {upcomingPayouts.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-gray-900 text-sm">{p.group_name}</p>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Cycle {p.cycle}</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-600">{fmtNGN(p.amount)}</p>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Due {fmtDate(p.due_date)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Your Groups ── */}
            <section>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Groups</p>
                {groups.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-10 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                            <Users2 className="w-7 h-7 text-emerald-600" />
                        </div>
                        <p className="font-bold text-gray-800">No groups yet</p>
                        <p className="text-sm text-gray-400">Create a group or join one with a Group ID.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {groups.map(g => (
                            <div key={g.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-gray-900">{g.name}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{freqLabel(g.frequency)} · {g.member_count}/{g.member_limit} members</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                                </div>
                                <div className="px-5 py-4 space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Contribution', value: fmtNGN(g.contribution_amount) },
                                            { label: 'Cycle', value: `#${g.current_cycle}` },
                                            { label: 'Your Position', value: `#${g.member.payout_position}` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                                                <p className="text-[10px] text-gray-400">{label}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(g.start_date)}</span>
                                        <span>Total: {fmtNGN(g.total_collected)}</span>
                                    </div>
                                    <button type="button" onClick={() => setDisputeGroup({ id: g.id, name: g.name })}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors w-full">
                                        <AlertTriangle className="w-3 h-3 shrink-0" /> Raise a dispute
                                        <ChevronRight className="w-3 h-3 ml-auto" />
                                    </button>
                                    <p className="text-[10px] text-gray-300 break-all">ID: {g.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Open Disputes ── */}
            {openDisputes.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Disputes</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{openDisputes.length}</span>
                    </div>
                    <div className="space-y-3">
                        {openDisputes.map(d => (
                            <div key={d.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{d.group_name}</p>
                                        {d.raised_by_username && <p className="text-[11px] text-gray-400">by @{d.raised_by_username}</p>}
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Open</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{d.description}</p>
                                <p className="text-[11px] text-gray-400">{fmtDate(d.created_at)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Dialogs */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Create Ajo Group</DialogTitle></DialogHeader>
                    <CreateAjoGroupForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={showJoin} onOpenChange={setShowJoin}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Join Ajo Group</DialogTitle></DialogHeader>
                    <JoinAjoGroupForm onSuccess={() => setShowJoin(false)} onCancel={() => setShowJoin(false)} />
                </DialogContent>
            </Dialog>
            {disputeGroup && (
                <DisputeModal groupId={disputeGroup.id} groupName={disputeGroup.name} open={!!disputeGroup} onOpenChange={o => { if (!o) setDisputeGroup(null) }} />
            )}
        </div>
    )
}
