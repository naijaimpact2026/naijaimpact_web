'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/toast'
import { requestJob } from '@/lib/actions/artisan-jobs'

const field =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function HireArtisanDialog({
  open,
  onOpenChange,
  listingId,
  serviceTitle,
  artisanName,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  listingId: string
  serviceTitle: string
  artisanName: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState(serviceTitle.slice(0, 120))
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await requestJob({
      listingId,
      title,
      description,
      address,
      preferredDate: date || undefined,
      budgetNGN: budget ? Number(budget) : undefined,
    })
    setBusy(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    toast.success(`Request sent to ${artisanName}. You'll be notified when they send a quote.`)
    onOpenChange(false)
    router.push(`/app/artisans/jobs/${res.data!.jobId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hire {artisanName}</DialogTitle>
          <DialogDescription>
            Describe the job. {artisanName} will reply with a price. You only pay once you accept it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="job-title" className="mb-1.5 block text-sm font-semibold text-foreground">Job title</label>
            <input id="job-title" className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="job-desc" className="mb-1.5 block text-sm font-semibold text-foreground">What needs doing?</label>
            <textarea
              id="job-desc"
              rows={4}
              maxLength={2000}
              className={`${field} resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Two sockets in the kitchen stopped working after a power surge."
              required
            />
          </div>
          <div>
            <label htmlFor="job-address" className="mb-1.5 block text-sm font-semibold text-foreground">Address</label>
            <input
              id="job-address"
              className={field}
              value={address}
              maxLength={300}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area, city"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="job-date" className="mb-1.5 block text-sm font-semibold text-foreground">Preferred date</label>
              <input id="job-date" type="date" min={today} className={field} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="job-budget" className="mb-1.5 block text-sm font-semibold text-foreground">Budget (optional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <input
                  id="job-budget"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={`${field} pl-8`}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p>
              When you accept the quote, your payment is held in escrow. The artisan is only paid after you approve the
              finished work. If something goes wrong, you can open a dispute.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
