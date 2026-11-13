'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { CalendarCheck, CheckCircle2, Clock, Coins, Copy, Gift, GraduationCap, Loader2, Package, Shirt, Sparkles, XCircle, type LucideIcon } from 'lucide-react'
import { toast } from '@/components/toast'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { redeemRewardAction } from '@/lib/actions/world'
import { TOKENS_LABEL, XP_LABEL, type RedemptionStatus, type RedemptionView, type RewardKind, type RewardView } from '@/lib/world/types'

export const KIND_INFO: Record<RewardKind, { label: string; icon: LucideIcon; tint: string }> = {
    course_discount: { label: 'Course discount', icon: GraduationCap, tint: '#2563EB' },
    avatar_item: { label: 'Avatar item', icon: Shirt, tint: '#DB2777' },
    event_access: { label: 'Event access', icon: CalendarCheck, tint: '#16A34A' },
    merch: { label: 'Merch', icon: Package, tint: '#D97706' },
    other: { label: 'Reward', icon: Gift, tint: '#7C3AED' },
}

export const STATUS_INFO: Record<RedemptionStatus, { label: string; icon: LucideIcon; tone: string }> = {
    pending: { label: 'Being prepared', icon: Clock, tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
    fulfilled: { label: 'Ready', icon: CheckCircle2, tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    cancelled: { label: 'Cancelled · refunded', icon: XCircle, tone: 'bg-muted text-muted-foreground' },
}

const BLOCKED: Record<NonNullable<RewardView['blocked']>, string> = {
    out_of_stock: 'Out of stock',
    limit_reached: 'Already redeemed',
    insufficient_tokens: 'Not enough tokens',
}

function newRequestId()
{
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))
}

export default function RewardsExchange({ slug, enabled, balance: initialBalance, rewards: initialRewards, redemptions: initialRedemptions, color }: {
    slug: string; enabled: boolean; balance: number; rewards: RewardView[]; redemptions: RedemptionView[]; color: string
})
{
    const router = useRouter()
    const [balance, setBalance] = useState(initialBalance)
    const [rewards, setRewards] = useState(initialRewards)
    const [redemptions, setRedemptions] = useState(initialRedemptions)
    // The request id is fixed when the dialog opens, so repeated taps spend once.
    const [confirm, setConfirm] = useState<{ reward: RewardView; requestId: string } | null>(null)
    const [busy, start] = useTransition()

    function redeem()
    {
        if (!confirm || busy) return
        const { reward, requestId } = confirm
        start(async () =>
        {
            const r = await redeemRewardAction(slug, reward.id, requestId)
            if (!r.ok) { toast.error(r.error); return }
            setBalance(r.balance)
            setRedemptions((xs) => (xs.some((x) => x.id === r.redemption.id) ? xs : [r.redemption, ...xs]))
            setRewards((xs) => xs.map((x) =>
            {
                const mine = x.id === reward.id ? x.redeemedByMe + 1 : x.redeemedByMe
                const stock = x.id === reward.id && x.stock !== null ? Math.max(0, x.stock - 1) : x.stock
                const blocked = stock !== null && stock <= 0 ? 'out_of_stock' as const
                    : x.perUserLimit !== null && mine >= x.perUserLimit ? 'limit_reached' as const
                    : r.balance < x.costTokens ? 'insufficient_tokens' as const : null
                return { ...x, redeemedByMe: mine, stock, blocked }
            }))
            setConfirm(null)
            toast.success(r.redemption.status === 'fulfilled' ? `Redeemed! Your code: ${r.redemption.code}` : 'Redeemed! We’ll notify you when it’s ready.')
            router.refresh()
        })
    }

    async function copy(code: string)
    {
        try { await navigator.clipboard.writeText(code); toast.success('Code copied.') } catch { toast.error('Couldn’t copy. Select the code instead.') }
    }

    return (
        <div className="space-y-6">
            <header className="hw-rise overflow-hidden rounded-3xl p-5 text-white shadow-md sm:p-6" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/80"><Gift className="h-4 w-4" /> Rewards Exchange</p>
                        <h1 className="text-2xl font-extrabold sm:text-3xl">Spend your {TOKENS_LABEL}</h1>
                        <p className="max-w-md text-sm text-white/85">Course discounts, avatar items and event access. {TOKENS_LABEL} never buy score or {XP_LABEL}, can’t be sent to anyone and can’t be cashed out.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 text-right ring-1 ring-white/25">
                        <p className="text-xs font-semibold text-white/80">Your balance</p>
                        <p className="flex items-center justify-end gap-1.5 text-3xl font-extrabold tabular-nums"><Coins className="h-6 w-6" />{balance.toLocaleString()}</p>
                    </div>
                </div>
            </header>

            {!enabled ? (
                <section className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
                    <Sparkles className="mx-auto h-8 w-8 text-violet-500" />
                    <h2 className="text-lg font-bold text-foreground">The Rewards Exchange opens soon</h2>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">Keep earning {TOKENS_LABEL} from missions. You’ll spend them here on approved rewards.</p>
                </section>
            ) : (
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-foreground">Catalogue</h2>
                    {rewards.length === 0 ? (
                        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No rewards yet. New rewards are being added. Keep earning {TOKENS_LABEL}.</p>
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {rewards.map((r, i) =>
                            {
                                const k = KIND_INFO[r.kind]
                                const short = Math.max(0, r.costTokens - balance)
                                return (
                                    <li key={r.id} className="hw-rise flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                                        {r.imageUrl
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={r.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                                            : <div className="flex aspect-[16/9] items-center justify-center" style={{ backgroundColor: `${k.tint}14` }}><k.icon className="h-12 w-12" style={{ color: k.tint }} /></div>}
                                        <div className="flex flex-1 flex-col gap-2 p-4">
                                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: k.tint }}>{k.label}</p>
                                            <h3 className="font-bold leading-snug text-foreground">{r.title}</h3>
                                            {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                                            <p className="text-xs text-muted-foreground">
                                                {r.stock !== null ? `${r.stock} left` : 'Unlimited'}
                                                {r.perUserLimit !== null ? ` · ${r.perUserLimit === 1 ? 'one' : `up to ${r.perUserLimit}`} per student` : ''}
                                                {r.fulfilment === 'auto' ? ' · instant code' : ''}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                                <span className="inline-flex items-center gap-1 text-lg font-extrabold tabular-nums text-foreground"><Coins className="h-4 w-4 text-amber-500" />{r.costTokens}</span>
                                                <button type="button" disabled={Boolean(r.blocked)} onClick={() => setConfirm({ reward: r, requestId: newRequestId() })}
                                                    className="hw-press rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none" style={r.blocked ? undefined : { backgroundColor: color }}>
                                                    {r.blocked ? (r.blocked === 'insufficient_tokens' ? `Need ${short} more` : BLOCKED[r.blocked]) : 'Redeem'}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            )}

            {(enabled || redemptions.length > 0) && (
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-foreground">My redemptions</h2>
                    {redemptions.length === 0 ? (
                        <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">Nothing redeemed yet.</p>
                    ) : (
                        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                            {redemptions.map((x) =>
                            {
                                const st = STATUS_INFO[x.status]
                                return (
                                    <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-foreground">{x.reward.title}</p>
                                            <p className="text-xs text-muted-foreground">{x.cost} {TOKENS_LABEL} · {formatDistanceToNow(new Date(x.createdAt), { addSuffix: true })}</p>
                                            {x.note && <p className="mt-1 text-sm text-muted-foreground">{x.note}</p>}
                                        </div>
                                        {x.code && x.status === 'fulfilled' && (
                                            <button type="button" onClick={() => copy(x.code!)} className="hw-press inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-sm font-bold text-foreground hover:bg-muted" aria-label={`Copy code ${x.code}`}>
                                                {x.code}<Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                        )}
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.tone}`}><st.icon className="h-3.5 w-3.5" />{st.label}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            )}

            <AlertDialog open={confirm !== null} onOpenChange={(o) => { if (!o && !busy) setConfirm(null) }}>
                <AlertDialogContent className="rounded-3xl sm:max-w-md">
                    {confirm && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Redeem {confirm.reward.title}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This spends <strong>{confirm.reward.costTokens} {TOKENS_LABEL}</strong>. Your balance will be <strong>{(balance - confirm.reward.costTokens).toLocaleString()}</strong>.
                                    {confirm.reward.fulfilment === 'auto' ? ' You’ll get your code straight away.' : ' The team will prepare it and notify you.'}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={busy}>Not now</AlertDialogCancel>
                                <button type="button" onClick={redeem} disabled={busy} className="hw-press inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: color }}>
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />} Spend {confirm.reward.costTokens}
                                </button>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
