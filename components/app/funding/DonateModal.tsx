'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { initiateCampaignDonation, donateFromWallet, verifyAndProcessCampaignDonation } from '@/lib/actions/funding'
import { Loader2, Heart, CheckCircle2, CreditCard, Wallet, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Script from 'next/script'

const donateSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Please enter a valid amount' })
    .min(100, 'Minimum donation is ₦100')
    .max(50_000_000, 'Maximum donation is ₦50,000,000'),
  walletPin: z.string().optional(),
})

type DonateFormValues = z.infer<typeof donateSchema>

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000]

interface DonateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  campaignTitle: string
  userEmail?: string
  initialRecoveryMode?: boolean
}

export default function DonateModal({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
  userEmail = 'donor@hubnovo.com',
  initialRecoveryMode = false,
}: DonateModalProps) {
  const [method, setMethod] = useState<'paystack' | 'wallet'>('paystack')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successAmount, setSuccessAmount] = useState<number>(0)
  const [successRef, setSuccessRef] = useState<string>('')
  const [recoveryMode, setRecoveryMode] = useState(initialRecoveryMode)
  const [recoveryRef, setRecoveryRef] = useState('')
  const [recovering, setRecovering] = useState(false)

  const form = useForm<DonateFormValues>({
    resolver: zodResolver(donateSchema),
    defaultValues: {
      amount: 2500,
      walletPin: '',
    },
  })

  const currentAmount = form.watch('amount')

  const handlePresetSelect = (preset: number) => {
    form.setValue('amount', preset, { shouldValidate: true })
  }

  async function onSubmit(values: DonateFormValues) {
    setSubmitting(true)

    try {
      if (method === 'wallet') {
        // Direct Hubnovo Wallet deduction
        const res = await donateFromWallet(campaignId, values.amount, values.walletPin)
        if (res.success) {
          setSuccess(true)
          setSuccessAmount(values.amount)
          setSuccessRef(`WLT-${Date.now().toString(36).toUpperCase()}`)
          toast.success(res.message || 'Donation successful!')
          // Force full page reload so server component re-fetches updated totals
          setTimeout(() => window.location.reload(), 1500)
        }
      } else {
        // Paystack inline checkout
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        if (!paystackKey) {
          throw new Error('Payment configuration error: missing public key')
        }

        const { reference, userId } = await initiateCampaignDonation(campaignId, values.amount)

        if (!window.PaystackPop) {
          throw new Error('Paystack payment modal is still loading. Please try again.')
        }

        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: userEmail,
          amount: Math.round(values.amount * 100), // in kobo
          ref: reference,
          metadata: {
            type: 'campaign_donation',
            userId: userId || undefined,
            referenceId: campaignId,
            campaignTitle,
          },
          onSuccess: async (tx) => {
            // Restore modal and show verifying loader
            onOpenChange(true)
            setVerifying(true)
            toast.info('Verifying payment with Paystack...')
            try {
              const res = await verifyAndProcessCampaignDonation(campaignId, tx.reference)
              if (res.success) {
                setVerifying(false)
                setSuccess(true)
                setSuccessAmount(res.amount ?? values.amount)
                setSuccessRef(tx.reference)
                toast.success(res.message || `Thank you! Payment confirmed: ${tx.reference}`)
                // Reload page to reflect updated totals and donor list
                setTimeout(() => window.location.reload(), 1500)
              } else {
                setVerifying(false)
                toast.error(res.error || 'Payment verification failed. Use your reference to recover.')
              }
            } catch (err: any) {
              setVerifying(false)
              console.error('Donation verification error:', err)
              toast.error(err.message || 'Verification failed. Try recovering with your reference.')
            } finally {
              setSubmitting(false)
            }
          },
          onClose: () => {
            // Re-open DonateModal so the user isn't left hanging if they cancel
            onOpenChange(true)
            setSubmitting(false)
            setVerifying(false)
          },
        })

        // Temporarily close Dialog so Radix's focus-trap and pointer-events lock
        // don't freeze Paystack's popup iframe on first click.
        onOpenChange(false)
        setTimeout(() => {
          handler.openIframe()
        }, 80)
      }
    } catch (err: any) {
      console.error('Donation error:', err)
      toast.error(err.message || 'Payment initiation failed')
      setSubmitting(false)
    }
  }

  async function handleRecover() {
    if (!recoveryRef.trim()) {
      toast.error('Please enter a Paystack reference')
      return
    }

    setRecovering(true)
    try {
      const res = await verifyAndProcessCampaignDonation(campaignId, recoveryRef.trim())
      if (res.success) {
        setSuccess(true)
        setSuccessAmount(res.amount || 0)
        setSuccessRef(recoveryRef.trim())
        toast.success(res.message || 'Payment successfully recovered and credited!')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(res.error || 'Could not verify this payment reference')
      }
    } catch (err: any) {
      console.error('Recovery error:', err)
      toast.error(err.message || 'Recovery failed')
    } finally {
      setRecovering(false)
    }
  }

  const handleClose = () => {
    // Prevent accidental dismiss while processing or verifying
    if (submitting || verifying) return
    setSuccess(false)
    setRecoveryMode(false)
    setRecoveryRef('')
    onOpenChange(false)
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <Dialog open={open} onOpenChange={handleClose} modal={false}>
        <DialogContent
          className="sm:max-w-md p-6 overflow-hidden rounded-2xl"
          onPointerDownOutside={(e) => {
            if (submitting || verifying) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            if (submitting || verifying) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Heart className="h-4 w-4 fill-emerald-600" />
              </div>
              <DialogTitle className="text-xl font-bold">Support this Cause</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
              Backing: &quot;{campaignTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Thank You for Your Impact!</h3>
                <p className="text-2xl font-black text-emerald-600">
                  ₦{successAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border w-full text-left space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono font-semibold text-foreground truncate max-w-[200px]">{successRef}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified & Credited
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your donation has been verified and applied to this initiative. Every contribution creates measurable progress.
              </p>
              <Button onClick={() => onOpenChange(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl">
                Done
              </Button>
            </div>
          ) : verifying ? (
            <div className="py-10 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Confirming Your Contribution...</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Verifying transaction reference with Paystack and applying your donation to the campaign.
                </p>
              </div>
            </div>
          ) : recoveryMode ? (
            <div className="space-y-5 pt-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => setRecoveryMode(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Recover or Verify Payment</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Confirm a completed Paystack transaction directly
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Paystack Reference</Label>
                  <Input
                    placeholder="e.g. DON-1740000000000-XXXXX"
                    value={recoveryRef}
                    onChange={(e) => setRecoveryRef(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter the reference code from your Paystack receipt, bank debit narration, or popup.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleRecover}
                  disabled={recovering || !recoveryRef.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 text-sm gap-2 rounded-xl"
                >
                  {recovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying with Paystack...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Verify & Recover Donation
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setRecoveryMode(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-2"
                >
                  Cancel and return to donate form
                </button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                {/* Preset Chips */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Select an Amount (₦)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((preset) => {
                      const active = currentAmount === preset
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            active
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-muted/40 text-foreground border-border hover:border-emerald-600/50'
                          }`}
                        >
                          ₦{preset.toLocaleString()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Amount Field */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold">Custom Amount (₦)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                            ₦
                          </span>
                          <Input
                            type="number"
                            min={100}
                            className="pl-8 text-base font-bold"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <Label className="text-xs font-semibold text-muted-foreground">Payment Method</Label>
                  <Tabs
                    value={method}
                    onValueChange={(val) => setMethod(val as 'paystack' | 'wallet')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
                      <TabsTrigger value="paystack" className="gap-2 text-xs font-semibold rounded-lg">
                        <CreditCard className="h-3.5 w-3.5" />
                        Card / Bank
                      </TabsTrigger>
                      <TabsTrigger value="wallet" className="gap-2 text-xs font-semibold rounded-lg">
                        <Wallet className="h-3.5 w-3.5" />
                        Hubnovo Wallet
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paystack" className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Secured by Paystack (Mastercard, Visa, Verve, Bank Transfer, USSD).
                    </TabsContent>

                    <TabsContent value="wallet" className="pt-2 space-y-2">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Direct deduction from your Hubnovo wallet with zero gateway fee.
                      </p>
                      <FormField
                        control={form.control}
                        name="walletPin"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Wallet PIN (if configured)</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                maxLength={4}
                                placeholder="••••"
                                {...field}
                                className="tracking-widest"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 text-sm gap-2 rounded-xl mt-3"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 fill-white" />
                      Donate ₦{(form.watch('amount') || 0).toLocaleString()}
                    </>
                  )}
                </Button>

                {/* Recovery toggle link */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setRecoveryMode(true)}
                    className="text-[11px] text-muted-foreground hover:text-emerald-600 underline font-medium transition-colors"
                  >
                    Already completed a transfer or need to recover payment?
                  </button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
