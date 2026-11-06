'use client'

import React, { useState } from 'react'
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Coins,
    Loader2,
    Lock,
    ShieldCheck,
    Wallet,
    X,
} from 'lucide-react'
import { requestCreatorPayout } from '@/lib/actions/creator-earnings'

interface CreatorWithdrawalModalProps {
    isOpen: boolean
    availableBalance: number
    onClose: () => void
    onSuccess: (transferredAmount: number, newBalance: number) => void
}

const NIGERIAN_BANKS = [
    'Access Bank',
    'GTBank (Guaranty Trust Bank)',
    'Zenith Bank',
    'United Bank for Africa (UBA)',
    'First Bank of Nigeria',
    'Kuda Microfinance Bank',
    'OPay',
    'PalmPay',
    'Stanbic IBTC Bank',
    'Fidelity Bank',
    'Sterling Bank',
    'Wema Bank / ALAT',
]

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString('en-NG')}`
}

export default function CreatorWithdrawalModal({
    isOpen,
    availableBalance,
    onClose,
    onSuccess,
}: CreatorWithdrawalModalProps) {
    const [amount, setAmount] = useState<string>('')
    const [destination, setDestination] = useState<'wallet' | 'bank'>('wallet')
    const [bankName, setBankName] = useState<string>(NIGERIAN_BANKS[0])
    const [accountNumber, setAccountNumber] = useState<string>('')
    const [accountName, setAccountName] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successData, setSuccessData] = useState<{ amount: number; dest: string } | null>(null)

    if (!isOpen) return null

    const numericAmount = Number(amount) || 0
    const remainingBalance = Math.max(0, availableBalance - numericAmount)
    const isAmountValid = numericAmount > 0 && numericAmount <= availableBalance

    const handleSetQuickAmount = (val: number) => {
        const capped = Math.min(val, availableBalance)
        setAmount(capped.toString())
        setErrorMsg(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        if (!isAmountValid) {
            setErrorMsg(`Please enter an amount between ₦1 and ${formatNaira(availableBalance)}.`)
            return
        }

        if (destination === 'bank') {
            if (!accountNumber.trim() || accountNumber.trim().length < 10) {
                setErrorMsg('Please enter a valid 10-digit Nigerian bank account number.')
                return
            }
            if (!accountName.trim()) {
                setErrorMsg('Please enter the verified account holder name.')
                return
            }
        }

        setIsSubmitting(true)
        try {
            const res = await requestCreatorPayout({
                amount: numericAmount,
                destination,
                bankName: destination === 'bank' ? bankName : undefined,
                accountNumber: destination === 'bank' ? accountNumber.trim() : undefined,
                accountName: destination === 'bank' ? accountName.trim() : undefined,
            })

            if (!res.success) {
                setErrorMsg(res.error || 'Failed to process withdrawal.')
                return
            }

            setSuccessData({
                amount: numericAmount,
                dest: destination === 'wallet' ? 'Hubnovo Wallet' : `${bankName} (${accountNumber})`,
            })

            onSuccess(numericAmount, res.newAvailableBalance ?? remainingBalance)
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetAndClose = () => {
        setAmount('')
        setErrorMsg(null)
        setSuccessData(null)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-200">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-2xl">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {successData ? (
                    /* Success view */
                    <div className="py-6 text-center space-y-4">
                        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                            <CheckCircle2 className="h-9 w-9" />
                        </span>
                        <div>
                            <h3 className="font-display text-xl font-bold text-foreground">
                                Payout Initiated Successfully
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Transferred{' '}
                                <strong className="text-foreground">{formatNaira(successData.amount)}</strong> to{' '}
                                <span className="font-semibold text-foreground">{successData.dest}</span>.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                            <p>
                                <strong>Status:</strong> Completed & logged in your itemized ledger.
                            </p>
                            <p>
                                <strong>Updated Available:</strong> {formatNaira(remainingBalance)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetAndClose}
                            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    /* Withdrawal Form */
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                                    <Wallet className="h-4 w-4" />
                                </span>
                                <h3 className="font-display text-lg font-bold text-foreground">
                                    Withdraw Creator Earnings
                                </h3>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Available to withdraw immediately:{' '}
                                <strong className="text-foreground">{formatNaira(availableBalance)}</strong>
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                                Payout Amount (₦)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                                    ₦
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableBalance}
                                    step="100"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g. 20000"
                                    className="w-full rounded-2xl border border-border/80 bg-muted/40 pl-9 pr-4 py-3 text-base font-extrabold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Quick selection pills */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[5000, 10000, 25000].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        disabled={preset > availableBalance}
                                        onClick={() => handleSetQuickAmount(preset)}
                                        className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                                    >
                                        +{formatNaira(preset)}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => handleSetQuickAmount(availableBalance)}
                                    className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                                >
                                    Max All ({formatNaira(availableBalance)})
                                </button>
                            </div>
                        </div>

                        {/* Destination Choice */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                                Payout Destination
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDestination('wallet')}
                                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                                        destination === 'wallet'
                                            ? 'border-primary bg-primary/10 shadow-sm'
                                            : 'border-border/70 bg-card/60 hover:bg-muted/40'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        Hubnovo Wallet
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        Instant transfer • ₦0 fee
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDestination('bank')}
                                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                                        destination === 'bank'
                                            ? 'border-primary bg-primary/10 shadow-sm'
                                            : 'border-border/70 bg-card/60 hover:bg-muted/40'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Nigerian Bank
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        Direct account transfer
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Bank Details (if Bank selected) */}
                        {destination === 'bank' && (
                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3 animate-in fade-in-50 duration-200">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">
                                        Select Bank
                                    </label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {NIGERIAN_BANKS.map((b) => (
                                            <option key={b} value={b}>
                                                {b}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">
                                        10-Digit Account Number
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0123456789"
                                        className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="As registered with your bank"
                                        className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Summary breakdown box */}
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Requested Payout</span>
                                <span className="font-bold text-foreground">
                                    {formatNaira(numericAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Withdrawal Processing Fee</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    ₦0.00 (Zero Fee)
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold">
                                <span className="text-foreground">Net Payout Transferred</span>
                                <span className="text-foreground">{formatNaira(numericAmount)}</span>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleResetAndClose}
                                className="flex-1 rounded-full border border-border/80 bg-card py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!isAmountValid || isSubmitting}
                                className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-4 w-4" />
                                        Confirm Withdrawal
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
