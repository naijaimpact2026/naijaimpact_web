'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Search,
  AlertCircle,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { requestWithdrawal } from '@/lib/actions/wallet'
import { fetchNigerianBanks, resolveBankAccount, type Bank } from '@/lib/actions/banks'
import Link from 'next/link'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const bankSchema = z.object({
  bankName: z.string().min(2, 'Please select your bank'),
  bankCode: z.string().min(1, 'Please select your bank'),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  accountName: z.string().min(2, 'Account name must be verified'),
  amount: z
    .number({ invalid_type_error: 'Please enter a valid amount' })
    .min(100, 'Minimum withdrawal is ₦100'),
})

const withdrawPinSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only digits'),
})

type BankFormValues = z.infer<typeof bankSchema>
type WithdrawPinFormValues = z.infer<typeof withdrawPinSchema>

type Step = 'bank' | 'pin' | 'success'

// ─── Props ────────────────────────────────────────────────────────────────────

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPin: boolean
  currentBalance: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WithdrawModal({
  open,
  onOpenChange,
  hasPin,
  currentBalance,
}: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('bank')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bank Directory State
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [bankSearch, setBankSearch] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Account Resolution State
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  // Captured bank details to pass to step 2
  const [bankDetails, setBankDetails] = useState<BankFormValues | null>(null)

  const bankForm = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
      amount: undefined as unknown as number,
    },
  })

  const pinForm = useForm<WithdrawPinFormValues>({
    resolver: zodResolver(withdrawPinSchema),
    defaultValues: { pin: '' },
  })

  const watchedAccountNumber = bankForm.watch('accountNumber')
  const watchedAccountName = bankForm.watch('accountName')

  // 1. Fetch Nigerian banks from Paystack on modal open
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
    const cleanAcc = (watchedAccountNumber || '').replace(/\D/g, '')

    if (cleanAcc.length !== 10 || !selectedBank) {
      bankForm.setValue('accountName', '')
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
          bankForm.setValue('accountName', res.accountName, { shouldValidate: true })
          bankForm.clearErrors('accountName')
          setResolveError(null)
        } else {
          bankForm.setValue('accountName', '')
          setResolveError(res.error || 'Could not verify account name')
        }
      } catch (err: any) {
        if (!active) return
        bankForm.setValue('accountName', '')
        setResolveError(err.message || 'Verification failed')
      } finally {
        if (active) setIsResolving(false)
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [watchedAccountNumber, selectedBank, bankForm])

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  )

  const handleSelectPreset = (pct: number) => {
    const val = Math.floor(currentBalance * pct)
    bankForm.setValue('amount', val, { shouldValidate: true })
  }

  // ── Step 1: Bank details ──────────────────────────────────────────────────
  function onConfirmBank(values: BankFormValues) {
    if (values.amount > currentBalance) {
      bankForm.setError('amount', { message: 'Insufficient balance.' })
      return
    }
    if (!values.accountName) {
      setResolveError('Please wait for account name verification to complete')
      return
    }
    setBankDetails(values)
    setError(null)
    setStep('pin')
  }

  // ── Step 2: PIN + submit ──────────────────────────────────────────────────
  async function onConfirmPin(values: WithdrawPinFormValues) {
    if (!bankDetails) return
    setLoading(true)
    setError(null)

    try {
      const result = await requestWithdrawal(
        bankDetails.bankName,
        bankDetails.accountNumber,
        bankDetails.accountName,
        bankDetails.amount,
        values.pin
      )

      if (!result.success) {
        const msg = result.error
        if (msg.toLowerCase().includes('pin') || msg.toLowerCase().includes('incorrect')) {
          pinForm.setError('pin', { message: msg })
        } else if (msg.toLowerCase().includes('insufficient')) {
          setError(msg)
          setStep('bank')
        } else {
          setError(msg)
        }
        return
      }

      setStep('success')
    } catch {
      setError('Withdrawal request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reset + close ─────────────────────────────────────────────────────────
  function handleClose() {
    setStep('bank')
    setBankDetails(null)
    setError(null)
    setSelectedBank(null)
    setBankSearch('')
    setIsBankDropdownOpen(false)
    setResolveError(null)
    bankForm.reset()
    pinForm.reset()
    onOpenChange(false)
  }

  function handleOpenChange(val: boolean) {
    if (!val) handleClose()
    else onOpenChange(val)
  }

  // ── No PIN — redirect to settings ─────────────────────────────────────────
  if (!hasPin) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>You need a wallet PIN to withdraw funds.</DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <div className="flex justify-center">
              <ShieldAlert className="w-12 h-12 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Set a 6-digit PIN in Settings to secure your transactions and enable withdrawals.
            </p>
            <Button asChild className="w-full gradient-primary text-white rounded-xl">
              <Link href="/app/settings" onClick={handleClose}>
                Go to Settings
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-border/80 bg-background shadow-2xl">
        {/* ── Success ── */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Withdrawal Requested</DialogTitle>
            </DialogHeader>
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div>
                <p className="font-extrabold text-2xl text-foreground">
                  {formatNGN(bankDetails?.amount ?? 0)}
                </p>
                <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">
                  Withdrawal Pending
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-semibold text-foreground">{bankDetails?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-mono font-semibold text-foreground">{bankDetails?.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Holder</span>
                  <span className="font-semibold uppercase text-foreground">{bankDetails?.accountName}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Your transfer is being processed. Funds typically settle within minutes to a few hours depending on the receiving bank.
              </p>
              <Button onClick={handleClose} className="w-full mt-2 rounded-xl gradient-primary text-white">
                Done
              </Button>
            </div>
          </>
        )}

        {/* ── Step 1: Bank details ── */}
        {step === 'bank' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Withdraw Funds</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select your Nigerian bank and enter your 10-digit account number. Your account holder name will be automatically pulled.
              </DialogDescription>
            </DialogHeader>

            <Form {...bankForm}>
              <form
                onSubmit={bankForm.handleSubmit(onConfirmBank)}
                className="space-y-4 pt-1"
                noValidate
              >
                {/* 1. Dynamic Bank Selector with Search */}
                <div className="space-y-1.5" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">Select Bank</Label>
                    {loadingBanks && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading banks...
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
                                  bankForm.setValue('bankName', b.name, { shouldValidate: true })
                                  bankForm.setValue('bankCode', b.code, { shouldValidate: true })
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
                  {bankForm.formState.errors.bankName && (
                    <p className="text-xs text-destructive">
                      {bankForm.formState.errors.bankName.message}
                    </p>
                  )}
                </div>

                {/* 2. Account Number Input */}
                <FormField
                  control={bankForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold">
                          10-Digit Account Number (NUBAN)
                        </FormLabel>
                        <span className="text-[11px] text-muted-foreground">
                          {(field.value || '').length}/10 digits
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="0123456789"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                          className="h-11 rounded-xl font-mono text-sm tracking-widest"
                          aria-label="Bank account number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 3. Automatic Account Holder Name Resolution Box */}
                {isResolving && (
                  <div className="p-3 rounded-2xl bg-muted/60 border border-border text-xs flex items-center gap-2.5 text-muted-foreground animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    <span>Pulling account holder name from Paystack & NIBSS...</span>
                  </div>
                )}

                {!isResolving && watchedAccountName && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                          Account Holder Name
                        </p>
                        <p className="font-extrabold text-sm truncate uppercase text-foreground">
                          {watchedAccountName}
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

                {/* 4. Amount input with presets */}
                <FormField
                  control={bankForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold">Amount (NGN)</FormLabel>
                        <span className="text-xs text-muted-foreground">
                          Available: <span className="font-semibold text-emerald-600">{formatNGN(currentBalance)}</span>
                        </span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold select-none">
                            ₦
                          </span>
                          <Input
                            type="number"
                            min={100}
                            step={100}
                            max={currentBalance}
                            className="pl-8 text-base font-bold h-11 rounded-xl"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            aria-label="Withdrawal amount in Naira"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />

                      {/* Quick percentage presets */}
                      <div className="flex items-center gap-2 pt-1">
                        {[
                          { label: '25%', pct: 0.25 },
                          { label: '50%', pct: 0.5 },
                          { label: '75%', pct: 0.75 },
                          { label: 'Max', pct: 1.0 },
                        ].map(({ label, pct }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handleSelectPreset(pct)}
                            className="flex-1 py-1 rounded-lg border border-border text-[11px] font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-muted-foreground hover:text-foreground"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!watchedAccountName || isResolving || !selectedBank}
                  className="w-full h-11 rounded-xl gradient-primary text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isResolving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Account...
                    </span>
                  ) : (
                    'Continue to PIN'
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}

        {/* ── Step 2: PIN ── */}
        {step === 'pin' && bankDetails && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Confirm Withdrawal</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review your payout details and enter your 6-digit Wallet PIN.
              </DialogDescription>
            </DialogHeader>

            {/* Bank details summary */}
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-semibold text-foreground">{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono font-semibold text-foreground">{bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Holder</span>
                <span className="font-bold uppercase text-foreground">{bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border mt-1">
                <span className="text-muted-foreground font-medium">Debit Amount</span>
                <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                  -{formatNGN(bankDetails.amount)}
                </span>
              </div>
            </div>

            <Form {...pinForm}>
              <form
                onSubmit={pinForm.handleSubmit(onConfirmPin)}
                className="space-y-5"
                noValidate
              >
                <FormField
                  control={pinForm.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block text-xs font-semibold">
                        Enter 6-Digit Wallet PIN
                      </FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={loading}
                            aria-label="Wallet PIN"
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
                      </FormControl>
                      <FormMessage className="text-center text-xs" />
                    </FormItem>
                  )}
                />

                {pinForm.formState.errors.root && (
                  <p className="text-xs text-destructive text-center" role="alert">
                    {pinForm.formState.errors.root.message}
                  </p>
                )}

                {error && (
                  <p className="text-xs text-destructive text-center" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setStep('bank')
                      setError(null)
                      pinForm.reset()
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl gradient-primary text-white"
                    disabled={loading || pinForm.watch('pin')?.length !== 6}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing…
                      </>
                    ) : (
                      'Withdraw Now'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
