'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  Wallet,
} from 'lucide-react'
import {
  withdrawCampaignToWallet,
  withdrawCampaignToBank,
} from '@/lib/actions/funding'
import { fetchNigerianBanks, resolveBankAccount, type Bank } from '@/lib/actions/banks'
import type { FundingPayout } from '@/lib/types'
import { toast } from 'sonner'

interface WithdrawCampaignModalProps {
  campaignId: string
  campaignTitle: string
  amountRaised: number
  totalWithdrawn: number
  availableBalance: number
  hasPin: boolean
  pastPayouts?: FundingPayout[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DestinationType = 'wallet' | 'bank'
type Step = 'destination' | 'amount' | 'pin' | 'success'

function formatNGN(n: number): string {
  return `₦${n.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export default function WithdrawCampaignModal({
  campaignId,
  campaignTitle,
  amountRaised,
  totalWithdrawn,
  availableBalance: initialAvailable,
  hasPin,
  pastPayouts = [],
  open,
  onOpenChange,
}: WithdrawCampaignModalProps) {
  const router = useRouter()

  const [step, setStep] = useState<Step>('destination')
  const [destination, setDestination] = useState<DestinationType>('wallet')
  const [amount, setAmount] = useState<number>(initialAvailable)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    reference: string
    message: string
    amount: number
    destination: DestinationType
  } | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Bank Form & Dynamic Resolution State
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [bankSearch, setBankSearch] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const available = successData
    ? initialAvailable - successData.amount
    : initialAvailable

  // 1. Fetch Nigerian Banks from Paystack on modal open
  useEffect(() => {
    let active = true
    async function load() {
      if (banks.length > 0) return
      setLoadingBanks(true)
      try {
        const list = await fetchNigerianBanks()
        if (active) setBanks(list)
      } catch (err) {
        console.error('Failed to load banks:', err)
      } finally {
        if (active) setLoadingBanks(false)
      }
    }
    if (open) {
      load()
    }
    return () => {
      active = false
    }
  }, [open, banks.length])

  // Click-outside listener for bank dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false)
      }
    }
    if (isBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isBankDropdownOpen])

  // 2. Automatically resolve account name when bank & 10-digit account number match
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '')

    if (cleanAcc.length !== 10 || !selectedBank) {
      setAccountName('')
      setResolveError(null)
      return
    }

    let active = true
    setIsResolving(true)
    setResolveError(null)

    const timer = setTimeout(async () => {
      try {
        const res = await resolveBankAccount(cleanAcc, selectedBank.code)
        if (!active) return

        if (res.success && res.accountName) {
          setAccountName(res.accountName)
          setResolveError(null)
        } else {
          setAccountName('')
          setResolveError(res.error || 'Could not verify account name')
        }
      } catch (err: any) {
        if (!active) return
        setAccountName('')
        setResolveError(err.message || 'Verification failed')
      } finally {
        if (active) setIsResolving(false)
      }
    }, 350) // 350ms debounce

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [accountNumber, selectedBank])

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  )

  const handleSelectPreset = (pct: number) => {
    const val = Math.floor((available * pct) / 100)
    setAmount(val)
  }

  const handleNextFromAmount = () => {
    setError(null)
    if (!amount || amount < 100) {
      setError('Minimum withdrawal is ₦100')
      return
    }
    if (amount > available) {
      setError(`Amount cannot exceed available balance of ${formatNGN(available)}`)
      return
    }

    if (destination === 'bank') {
      if (!selectedBank) {
        setError('Please select your bank from the directory')
        return
      }
      if (!/^\d{10}$/.test(accountNumber.trim())) {
        setError('Account number must be exactly 10 digits')
        return
      }
      if (!accountName.trim()) {
        setError('Please wait for your account name to be verified or check your details')
        return
      }
    }

    if (!hasPin) {
      setError('You need to set up a 6-digit Wallet PIN before making withdrawals.')
      return
    }

    setStep('pin')
  }

  const handleExecuteWithdrawal = async () => {
    if (pin.length !== 6) {
      setError('Please enter your 6-digit Wallet PIN')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (destination === 'wallet') {
        const res = await withdrawCampaignToWallet(campaignId, amount, pin)
        setSuccessData({
          reference: res.reference,
          message: res.message,
          amount,
          destination: 'wallet',
        })
        setStep('success')
        toast.success(res.message)
        router.refresh()
      } else {
        const res = await withdrawCampaignToBank(
          campaignId,
          {
            bankName: selectedBank?.name || '',
            accountNumber,
            accountName,
            bankCode: selectedBank?.code,
          },
          amount,
          pin
        )
        setSuccessData({
          reference: res.reference,
          message: res.message,
          amount,
          destination: 'bank',
        })
        setStep('success')
        toast.success(res.message)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed. Please check your PIN.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      // Reset state on close
      setStep('destination')
      setPin('')
      setError(null)
      setSuccessData(null)
      setIsBankDropdownOpen(false)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-border/80 bg-background shadow-2xl">
        {/* ── STEP 1: DESTINATION ── */}
        {step === 'destination' && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">
                Withdraw Campaign Funds
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select where you want to transfer your crowdfunded money from{' '}
                <span className="font-semibold text-foreground">&quot;{campaignTitle}&quot;</span>.
              </DialogDescription>
            </DialogHeader>

            {/* Balance Overview Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Available to Withdraw
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatNGN(available)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Raised: {formatNGN(amountRaised)}
                </span>
              </div>
            </div>

            {available <= 0 ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p>
                  You do not have any funds available for withdrawal at this time. All raised money
                  has either already been disbursed or no donations have been received yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Payout Destination
                </p>

                {/* Option 1: Platform Wallet */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDestination('wallet')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    destination === 'wallet'
                      ? 'border-emerald-600 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">
                        Hubnovo Platform Wallet
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        Instant • 0% Fee
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Credit your Hubnovo Wallet balance immediately. You can spend it on marketplace items,
                      fund other projects, or transfer to your bank anytime.
                    </p>
                  </div>
                </div>

                {/* Option 2: Direct Bank Account */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDestination('bank')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    destination === 'bank'
                      ? 'border-emerald-600 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">
                        Direct Nigerian Bank Account
                      </h4>
                      <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Verified via Paystack NUBAN
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Transfer money directly to your verified commercial or microfinance bank account with
                      instant account name verification.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl gap-2 mt-4 text-base"
                  onClick={() => setStep('amount')}
                >
                  Continue with {destination === 'wallet' ? 'Platform Wallet' : 'Bank Account'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Payout History Section Toggle */}
            {pastPayouts.length > 0 && (
              <div className="pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Past Campaign Payouts ({pastPayouts.length})
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHistory && (
                  <div className="mt-3 divide-y divide-border/60 max-h-48 overflow-y-auto text-xs">
                    {pastPayouts.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatNGN(p.amount)} via {p.destination === 'wallet' ? 'Wallet' : p.bank_name || 'Bank'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            • {p.reference}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: AMOUNT & DETAILS ── */}
        {step === 'amount' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setStep('destination')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {destination === 'wallet' ? 'Transfer to Wallet' : 'Bank Account Details'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {destination === 'wallet'
                    ? 'Specify how much you want to transfer to your wallet'
                    : 'Select your bank and enter your 10-digit NUBAN'}
                </DialogDescription>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount-input" className="text-xs font-bold text-foreground">
                  Withdrawal Amount (NGN)
                </Label>
                <span className="text-xs text-muted-foreground">
                  Available: <span className="font-semibold text-emerald-600">{formatNGN(available)}</span>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground select-none">
                  ₦
                </span>
                <Input
                  id="amount-input"
                  type="number"
                  min={100}
                  max={available}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-9 pr-4 text-xl font-bold h-13 rounded-2xl border-border/80 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Quick percentage pills */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { label: '25%', pct: 0.25 },
                  { label: '50%', pct: 0.5 },
                  { label: '75%', pct: 0.75 },
                  { label: '100% (All)', pct: 1.0 },
                ].map(({ label, pct }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelectPreset(pct)}
                    className="flex-1 py-1.5 rounded-xl border border-border text-xs font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank details fields if Destination === 'bank' */}
            {destination === 'bank' && (
              <div className="space-y-4 pt-3 border-t border-border/60">
                {/* 1. Dynamic Bank Selector with Search */}
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Select Bank
                    </Label>
                    {loadingBanks && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading bank directory...
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      className="w-full h-11 px-3 rounded-xl border border-border/80 bg-card text-left flex items-center justify-between text-sm hover:border-emerald-500/50 transition-colors"
                    >
                      <span className={selectedBank ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                        {selectedBank ? selectedBank.name : 'Choose a Nigerian bank...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>

                    {/* Searchable Dropdown Menu */}
                    {isBankDropdownOpen && (
                      <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl border border-border bg-card shadow-2xl p-2 space-y-2 max-h-64 overflow-y-auto">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Type to filter banks (e.g. GTB, Kuda, Access)..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="pl-8 text-xs h-9 rounded-xl"
                            autoFocus
                          />
                        </div>

                        <div className="divide-y divide-border/40 overflow-y-auto max-h-48 text-xs">
                          {filteredBanks.length === 0 ? (
                            <p className="p-3 text-center text-muted-foreground">No banks found</p>
                          ) : (
                            filteredBanks.map((b) => (
                              <button
                                key={`${b.code}-${b.name}`}
                                type="button"
                                onClick={() => {
                                  setSelectedBank(b)
                                  setIsBankDropdownOpen(false)
                                  setBankSearch('')
                                }}
                                className="w-full p-2.5 text-left hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg flex items-center justify-between transition-colors"
                              >
                                <span className="font-medium truncate">{b.name}</span>
                                {b.is_popular && (
                                  <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0 ml-2">
                                    Popular
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Account Number Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      10-Digit Account Number (NUBAN)
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {accountNumber.length}/10 digits
                    </span>
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="h-11 rounded-xl font-mono text-sm tracking-widest"
                  />
                </div>

                {/* 3. Automatic Account Holder Name Resolution Box */}
                {isResolving && (
                  <div className="p-3 rounded-2xl bg-muted/60 border border-border text-xs flex items-center gap-2.5 text-muted-foreground animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    <span>Verifying account details with NIBSS & Paystack...</span>
                  </div>
                )}

                {!isResolving && accountName && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                          Account Holder Name
                        </p>
                        <p className="font-extrabold text-sm truncate uppercase text-foreground">
                          {accountName}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                      ✓ Verified
                    </span>
                  </div>
                )}

                {!isResolving && resolveError && (
                  <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resolveError}</span>
                  </div>
                )}
              </div>
            )}

            {/* PIN Warning if no PIN configured */}
            {!hasPin && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  You must create a 6-digit Wallet PIN before withdrawing.
                </span>
                <Link
                  href="/app/settings"
                  className="font-bold underline text-amber-700 dark:text-amber-300 shrink-0"
                >
                  Set PIN
                </Link>
              </div>
            )}

            {error && (
              <p className="text-xs font-semibold text-destructive px-1">{error}</p>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl gap-2 text-base transition-all disabled:opacity-50"
              onClick={handleNextFromAmount}
              disabled={
                available <= 0 ||
                (destination === 'bank' && (!accountName || isResolving))
              }
            >
              {destination === 'bank' && isResolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Bank Account...
                </>
              ) : (
                <>
                  Continue to PIN Verification
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── STEP 3: WALLET PIN CONFIRMATION ── */}
        {step === 'pin' && (
          <div className="space-y-6 text-center">
            <div className="flex items-center gap-2 text-left">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setStep('amount')}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Confirm with Wallet PIN
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Authorizing withdrawal of {formatNGN(amount)}
                </DialogDescription>
              </div>
            </div>

            {/* Confirmation summary card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campaign:</span>
                <span className="font-semibold text-foreground truncate max-w-[240px]">
                  {campaignTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold text-foreground">
                  {destination === 'wallet' ? 'Hubnovo Wallet' : `${selectedBank?.name} (${accountNumber})`}
                </span>
              </div>
              {destination === 'bank' && accountName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-bold text-foreground uppercase">{accountName}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-border/60">
                <span className="font-bold text-foreground">Total Payout:</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatNGN(amount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Enter your 6-digit Wallet PIN
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={pin}
                  onChange={setPin}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-destructive">{error}</p>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl gap-2 text-base"
              onClick={handleExecuteWithdrawal}
              disabled={loading || pin.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing Payout...
                </>
              ) : (
                <>Confirm & Disburse {formatNGN(amount)}</>
              )}
            </Button>
          </div>
        )}

        {/* ── STEP 4: SUCCESS STATE ── */}
        {step === 'success' && successData && (
          <div className="space-y-6 text-center py-2">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-black text-foreground">
                Withdrawal Successful!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {successData.message}
              </DialogDescription>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-black text-base text-foreground">
                  {formatNGN(successData.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold text-foreground">
                  {successData.destination === 'wallet' ? 'Platform Wallet' : `${selectedBank?.name} (${accountNumber})`}
                </span>
              </div>
              {successData.destination === 'bank' && accountName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient Name:</span>
                  <span className="font-bold text-foreground uppercase">{accountName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-foreground">{successData.reference}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link href="/app/wallet" className="flex-1">
                <Button variant="outline" className="w-full py-5 rounded-xl font-bold">
                  View Wallet
                </Button>
              </Link>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-xl"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
