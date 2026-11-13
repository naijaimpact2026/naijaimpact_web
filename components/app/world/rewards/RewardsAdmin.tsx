'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Check, Coins, Gift, Inbox, Loader2, Pencil, Plus, Power, PowerOff, Save, Undo2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { cancelRedemptionAction, fulfilRedemptionAction, saveRewardAction } from '@/lib/actions/world'
import type { AdminRedemption, AdminReward, RewardInput } from '@/lib/world/rewards'
import { TOKENS_LABEL, type RedemptionStatus, type RewardKind } from '@/lib/world/types'
import { KIND_INFO, STATUS_INFO } from './RewardsExchange'

const input = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const label = 'text-xs font-semibold text-muted-foreground'

type Draft = { id: string | null; title: string; description: string; imageUrl: string; costTokens: string; stock: string; perUserLimit: string; kind: RewardKind; fulfilment: 'auto' | 'manual'; isActive: boolean; sort: string }

const blank: Draft = { id: null, title: '', description: '', imageUrl: '', costTokens: '100', stock: '', perUserLimit: '1', kind: 'course_discount', fulfilment: 'manual', isActive: false, sort: '0' }
const fromReward = (r: AdminReward): Draft => ({
    id: r.id, title: r.title, description: r.description ?? '', imageUrl: r.imageUrl ?? '', costTokens: String(r.costTokens), stock: r.stock === null ? '' : String(r.stock),
    perUserLimit: r.perUserLimit === null ? '' : String(r.perUserLimit), kind: r.kind, fulfilment: r.fulfilment, isActive: r.isActive, sort: String(r.sort),
})
const intOrNull = (s: string) => (s.trim() === '' ? null : Math.round(Number(s)))

export default function RewardsAdmin({ slug, name, enabled, rewards, redemptions, counts, status }: {
    slug: string; name: string; enabled: boolean; rewards: AdminReward[]; redemptions: AdminRedemption[]; counts: Record<RedemptionStatus, number>; status: RedemptionStatus
})
{
    const router = useRouter()
    const [draft, setDraft] = useState<Draft | null>(null)
    const [acting, setActing] = useState<{ id: string; mode: 'fulfil' | 'cancel'; code: string; note: string } | null>(null)
    const [busy, start] = useTransition()

    function saveDraft()
    {
        if (!draft) return
        const body: Partial<RewardInput> = {
            title: draft.title, description: draft.description || null, imageUrl: draft.imageUrl || null, costTokens: Math.round(Number(draft.costTokens)),
            stock: intOrNull(draft.stock), perUserLimit: intOrNull(draft.perUserLimit), kind: draft.kind, fulfilment: draft.fulfilment,
            isActive: draft.isActive, sort: intOrNull(draft.sort) ?? 0,
        }
        start(async () =>
        {
            const r = await saveRewardAction(slug, draft.id, body)
            if (!r.ok) { toast.error(r.error); return }
            toast.success('Reward saved.')
            setDraft(null)
            router.refresh()
        })
    }

    function toggle(r: AdminReward)
    {
        start(async () =>
        {
            const res = await saveRewardAction(slug, r.id, { isActive: !r.isActive })
            if (!res.ok) { toast.error(res.error); return }
            toast.success(r.isActive ? 'Switched off. Students no longer see it.' : 'Switched on. Students can redeem it now.')
            router.refresh()
        })
    }

    function act()
    {
        if (!acting) return
        start(async () =>
        {
            const r = acting.mode === 'fulfil'
                ? await fulfilRedemptionAction(slug, acting.id, { code: acting.code, note: acting.note })
                : await cancelRedemptionAction(slug, acting.id, acting.note)
            if (!r.ok) { toast.error(r.error); return }
            toast.success(acting.mode === 'fulfil' ? 'Marked as fulfilled. The student was notified.' : 'Cancelled and refunded. The student was notified.')
            setActing(null)
            router.refresh()
        })
    }

    const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d))

    return (
        <div className="space-y-6">
            <Link href={`/app/competitions/${slug}/rewards`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {name} · Rewards Exchange
            </Link>
            <header>
                <h1 className="flex items-center gap-2 text-xl font-extrabold text-foreground sm:text-2xl"><Gift className="h-6 w-6 text-violet-500" /> Manage rewards</h1>
                <p className="text-sm text-muted-foreground">Non-cash rewards only. {TOKENS_LABEL} never buy score or XP. Cancelling a redemption refunds the tokens.</p>
            </header>

            {!enabled && (
                <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                    The Rewards Exchange tables aren’t in the database yet. Run <span className="font-mono">supabase/migrations/20261113100000_campus_rewards.sql</span> to switch it on.
                </p>
            )}

            {/* Redemptions */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Inbox className="h-5 w-5" /> Redemptions</h2>
                    <nav className="flex gap-1 rounded-2xl bg-muted p-1">
                        {(['pending', 'fulfilled', 'cancelled'] as const).map((s) => (
                            <Link key={s} href={`?status=${s}`} scroll={false} className={`hw-press rounded-xl px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                {s === 'pending' ? 'To fulfil' : s === 'fulfilled' ? 'Fulfilled' : 'Cancelled'} <span className="tabular-nums">{counts[s]}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
                {redemptions.length === 0 ? (
                    <p className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{status === 'pending' ? 'Nothing to fulfil.' : 'None yet.'}</p>
                ) : (
                    <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                        {redemptions.map((x) =>
                        {
                            const st = STATUS_INFO[x.status]
                            const open = acting?.id === x.id
                            return (
                                <li key={x.id} className="space-y-2 px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-foreground">{x.reward.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {x.user.displayName ?? x.user.username ?? 'Student'}{x.user.username ? ` (@${x.user.username})` : ''} · {x.cost} {TOKENS_LABEL} · {formatDistanceToNow(new Date(x.createdAt), { addSuffix: true })}
                                            </p>
                                            {(x.code || x.note) && <p className="mt-0.5 text-xs text-muted-foreground">{x.code && <span className="font-mono font-bold text-foreground">{x.code}</span>}{x.code && x.note ? ' · ' : ''}{x.note}</p>}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.tone}`}><st.icon className="h-3.5 w-3.5" />{st.label}</span>
                                        {x.status !== 'cancelled' && !open && (
                                            <div className="flex gap-1">
                                                {x.status === 'pending' && <button onClick={() => setActing({ id: x.id, mode: 'fulfil', code: '', note: '' })} className="hw-press inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" /> Fulfil</button>}
                                                <button onClick={() => setActing({ id: x.id, mode: 'cancel', code: '', note: '' })} className="hw-press inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted"><Undo2 className="h-3.5 w-3.5" /> Cancel &amp; refund</button>
                                            </div>
                                        )}
                                    </div>
                                    {open && acting && (
                                        <div className="grid gap-2 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                                            {acting.mode === 'fulfil' ? (
                                                <label className="space-y-1"><span className={label}>Code (optional)</span>
                                                    <input className={`${input} font-mono`} value={acting.code} onChange={(e) => setActing({ ...acting, code: e.target.value })} placeholder="e.g. LEARN20-AB12" /></label>
                                            ) : <p className="text-sm text-foreground sm:pb-2">Refunds <strong>{x.cost} {TOKENS_LABEL}</strong>.</p>}
                                            <label className="space-y-1"><span className={label}>{acting.mode === 'fulfil' ? 'Note to the student (how to use it)' : 'Reason (sent to the student)'}</span>
                                                <input className={input} value={acting.note} onChange={(e) => setActing({ ...acting, note: e.target.value })} /></label>
                                            <div className="flex gap-1">
                                                <button onClick={() => setActing(null)} disabled={busy} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Back</button>
                                                <button onClick={act} disabled={busy} className={`hw-press inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white disabled:opacity-60 ${acting.mode === 'fulfil' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}{acting.mode === 'fulfil' ? 'Mark fulfilled' : 'Cancel & refund'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {/* Catalogue */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-foreground">Catalogue</h2>
                    <button onClick={() => setDraft({ ...blank })} disabled={!enabled} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" /> New reward</button>
                </div>

                {draft && (
                    <div className="space-y-3 rounded-3xl border border-primary/40 bg-card p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1 sm:col-span-2"><span className={label}>Title</span><input className={input} maxLength={120} value={draft.title} onChange={(e) => set({ title: e.target.value })} /></label>
                            <label className="space-y-1 sm:col-span-2"><span className={label}>Description</span><textarea className={`${input} min-h-[60px]`} maxLength={1000} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></label>
                            <label className="space-y-1 sm:col-span-2"><span className={label}>Image URL (https, optional)</span><input className={input} value={draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} /></label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            <label className="space-y-1"><span className={label}>Cost ({TOKENS_LABEL})</span><input type="number" min={1} className={input} value={draft.costTokens} onChange={(e) => set({ costTokens: e.target.value })} /></label>
                            <label className="space-y-1"><span className={label}>Stock (empty = unlimited)</span><input type="number" min={0} className={input} value={draft.stock} onChange={(e) => set({ stock: e.target.value })} /></label>
                            <label className="space-y-1"><span className={label}>Per student (empty = no limit)</span><input type="number" min={1} className={input} value={draft.perUserLimit} onChange={(e) => set({ perUserLimit: e.target.value })} /></label>
                            <label className="space-y-1"><span className={label}>Type</span>
                                <select className={input} value={draft.kind} onChange={(e) => set({ kind: e.target.value as RewardKind })}>
                                    {(Object.keys(KIND_INFO) as RewardKind[]).map((k) => <option key={k} value={k}>{KIND_INFO[k].label}</option>)}
                                </select></label>
                            <label className="space-y-1"><span className={label}>Delivery</span>
                                <select className={input} value={draft.fulfilment} onChange={(e) => set({ fulfilment: e.target.value as 'auto' | 'manual' })}>
                                    <option value="manual">Manual (admin fulfils)</option>
                                    <option value="auto">Auto (instant code)</option>
                                </select></label>
                            <label className="space-y-1"><span className={label}>Order</span><input type="number" className={input} value={draft.sort} onChange={(e) => set({ sort: e.target.value })} /></label>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <label className="mr-auto flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} /> Active (students can see and redeem it)</label>
                            <button onClick={() => setDraft(null)} disabled={busy} className="hw-press rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                            <button onClick={saveDraft} disabled={busy} className="hw-press inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                            </button>
                        </div>
                    </div>
                )}

                {rewards.length === 0 ? (
                    <p className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No rewards yet.</p>
                ) : (
                    <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                        {rewards.map((r) =>
                        {
                            const k = KIND_INFO[r.kind]
                            return (
                                <li key={r.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 ${r.isActive ? '' : 'opacity-70'}`}>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${k.tint}18` }}><k.icon className="h-4 w-4" style={{ color: k.tint }} /></span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-foreground">{r.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {k.label} · {r.fulfilment === 'auto' ? 'auto code' : 'manual'} · {r.stock === null ? 'unlimited' : `${r.stock} left`} · {r.perUserLimit === null ? 'no limit' : `${r.perUserLimit} per student`} · redeemed {r.redeemed}{r.pending ? ` (${r.pending} to fulfil)` : ''}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 font-bold tabular-nums text-foreground"><Coins className="h-4 w-4 text-amber-500" />{r.costTokens}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{r.isActive ? 'Active' : 'Off'}</span>
                                    <div className="flex">
                                        <button onClick={() => setDraft(fromReward(r))} aria-label="Edit" title="Edit" className="hw-press rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => toggle(r)} disabled={busy} aria-label={r.isActive ? 'Switch off' : 'Switch on'} title={r.isActive ? 'Switch off' : 'Switch on'} className="hw-press rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">{r.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}
