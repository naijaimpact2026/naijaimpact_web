'use client'

import { useState } from 'react'
import { Loader2, Wallet, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/toast'
import { contributeToAjo } from '@/lib/actions/fintech/ajo'

interface ContributionPromptProps
{
    groupName: string
    groupId: string
    memberId: string
    cycle: number
    amount: number
    dueDate?: string
}

export default function ContributionPrompt({ groupName, groupId, memberId, cycle, amount, dueDate }: ContributionPromptProps)
{
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paid, setPaid] = useState(false)

    async function handlePay()
    {
        setError(null); setLoading(true)
        try
        {
            const r = await contributeToAjo(groupId, memberId, cycle)
            if (r.success) { setPaid(true); toast.success('Contribution paid!') } else setError(r.error)
        } finally { setLoading(false) }
    }

    if (paid)
    {
        return (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-emerald-700">Contribution paid!</p>
                    <p className="text-[11px] text-emerald-600">{groupName} · Cycle {cycle}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-gray-900">{groupName}</p>
                    <p className="text-[11px] text-gray-400">Cycle {cycle}{dueDate ? ` · Due ${new Date(dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}` : ''}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-amber-700" />
                </div>
            </div>
            <div>
                <p className="text-2xl font-black text-gray-900">₦{amount.toLocaleString('en-NG')}</p>
                <p className="text-[11px] text-amber-600 font-semibold">Due now</p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handlePay} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 transition-colors">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : 'Pay Now'}
            </button>
        </div>
    )
}
