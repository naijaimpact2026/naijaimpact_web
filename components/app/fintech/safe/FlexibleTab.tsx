'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, ArrowDownLeft, ArrowUpRight, Loader2, Wallet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createFlexibleAccount, topUpSavings, withdrawSavings } from '@/lib/actions/fintech/safe'
import type { SafeFlexibleAccount } from '@/lib/types'

function fmtNGN(n: number)
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const createSchema = z.object({ name: z.string().min(1, 'Name is required').max(100) })
const amountSchema = z.object({ amount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive() })
type CreateFormValues = z.infer<typeof createSchema>
type AmountFormValues = z.infer<typeof amountSchema>

function AmountModal({ open, onOpenChange, title, actionLabel, accent, onSubmit }: {
    open: boolean; onOpenChange: (v: boolean) => void; title: string; actionLabel: string; accent: string; onSubmit: (amount: number) => Promise<void>
})
{
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema) })
    async function handleFormSubmit(v: AmountFormValues) { await onSubmit(v.amount); reset() }
    return (
        <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v) }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Amount (NGN)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₦</span>
                            <Input type="number" min={1} step={100} className="pl-7" placeholder="5,000" {...register('amount', { valueAsNumber: true })} disabled={isSubmitting} />
                        </div>
                        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" className="flex-1 text-white font-bold" style={{ background: accent }} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</> : actionLabel}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function FlexibleTab({ accounts }: { accounts: SafeFlexibleAccount[] })
{
    const [showCreate, setShowCreate] = useState(false)
    const [topUpTarget, setTopUpTarget] = useState<SafeFlexibleAccount | null>(null)
    const [withdrawTarget, setWithdrawTarget] = useState<SafeFlexibleAccount | null>(null)
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) })

    async function handleCreate(v: CreateFormValues)
    {
        const r = await createFlexibleAccount(v.name)
        if (r.success) { toast.success('Account created!'); setShowCreate(false); reset() } else toast.error(r.error)
    }
    async function handleTopUp(amount: number)
    {
        if (!topUpTarget) return
        const r = await topUpSavings(topUpTarget.id, amount)
        if (r.success) { toast.success(`₦${amount.toLocaleString()} added`); setTopUpTarget(null) } else toast.error(r.error)
    }
    async function handleWithdraw(amount: number)
    {
        if (!withdrawTarget) return
        const r = await withdrawSavings(withdrawTarget.id, amount)
        if (r.success) { toast.success(`₦${amount.toLocaleString()} withdrawn`); setWithdrawTarget(null) } else toast.error(r.error)
    }

    const total = accounts.reduce((s, a) => s + a.balance, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-gray-400 font-medium">Total Balance</p>
                    <p className="text-2xl font-black text-sky-700">{fmtNGN(total)}</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                    <PlusCircle className="w-4 h-4" /> New Account
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-sky-600" />
                    </div>
                    <p className="font-bold text-gray-800">No flexible accounts yet</p>
                    <p className="text-sm text-gray-400">Deposit and withdraw anytime with no lock-in period.</p>
                    <button onClick={() => setShowCreate(true)}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                        Create Account
                    </button>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {accounts.map(a => (
                        <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{a.name}</p>
                                        <p className="text-[11px] text-gray-400">Withdraw anytime</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400">Balance</p>
                                <p className="text-3xl font-black text-gray-900">{fmtNGN(a.balance)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setTopUpTarget(a)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                                    <ArrowDownLeft className="w-3.5 h-3.5" /> Top Up
                                </button>
                                <button onClick={() => setWithdrawTarget(a)} disabled={a.balance === 0}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create dialog */}
            <Dialog open={showCreate} onOpenChange={v => { if (!v) reset(); setShowCreate(v) }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>New Flexible Account</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Account Name</Label>
                            <Input placeholder="e.g. Emergency Fund" {...register('name')} disabled={isSubmitting} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" className="flex-1 text-white font-bold bg-sky-600 hover:bg-sky-700" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AmountModal open={!!topUpTarget} onOpenChange={v => { if (!v) setTopUpTarget(null) }} title={`Top Up — ${topUpTarget?.name ?? ''}`} actionLabel="Top Up" accent="#0284c7" onSubmit={handleTopUp} />
            <AmountModal open={!!withdrawTarget} onOpenChange={v => { if (!v) setWithdrawTarget(null) }} title={`Withdraw — ${withdrawTarget?.name ?? ''}`} actionLabel="Withdraw" accent="#0f172a" onSubmit={handleWithdraw} />
        </div>
    )
}
