'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock, ShieldAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DISPUTE_REASONS, STATUS_META, type DisputeReason, type JobStatus } from '@/lib/artisan-jobs'

const TONES = {
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-primary/10 text-primary border-primary/20',
  warn: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  good: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  bad: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONES[meta.tone]}`}>
      {meta.label}
    </span>
  )
}

/** Wallet PIN confirmation before money moves. `onConfirm` returns an error message or null. */
export function PinDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  hasPin,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  confirmLabel: string
  hasPin: boolean
  onConfirm: (pin: string) => Promise<string | null>
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function close(v: boolean) {
    if (busy) return
    if (!v) {
      setPin('')
      setError(null)
    }
    onOpenChange(v)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Enter your 4–6 digit wallet PIN.')
      return
    }
    setBusy(true)
    setError(null)
    const err = await onConfirm(pin)
    setBusy(false)
    if (err) setError(err)
    else close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {!hasPin ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">Set a wallet PIN first to secure payments.</p>
            <Button asChild className="w-full">
              <Link href="/app/settings">Set a PIN in Settings</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                aria-label="Wallet PIN"
                placeholder="Wallet PIN"
                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-lg tracking-[0.4em] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Report a problem: freezes the escrow until an admin decides. */
export function DisputeDialog({
  open,
  onOpenChange,
  reasons,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  reasons: DisputeReason[]
  onSubmit: (reason: DisputeReason, details: string) => Promise<string | null>
}) {
  const [reason, setReason] = useState<DisputeReason>(reasons[0])
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (details.trim().length < 10) {
      setError('Explain what happened in at least 10 characters.')
      return
    }
    setBusy(true)
    setError(null)
    const err = await onSubmit(reason, details.trim())
    setBusy(false)
    if (err) setError(err)
    else {
      setDetails('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" /> Report a problem
          </DialogTitle>
          <DialogDescription>
            The payment stays safely in escrow while our team reviews what happened. Both sides can be asked for more
            details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold text-foreground">What went wrong?</legend>
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                  reason === r ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-primary" />
                {DISPUTE_REASONS[r]}
              </label>
            ))}
          </fieldset>
          <div>
            <label htmlFor="dispute-details" className="mb-1.5 block text-sm font-semibold text-foreground">
              Details
            </label>
            <textarea
              id="dispute-details"
              rows={4}
              maxLength={2000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What was agreed, what happened, and what you'd like to happen now."
              className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="destructive" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Open dispute'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
