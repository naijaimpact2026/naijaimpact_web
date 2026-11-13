'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/toast'
import { resolveJobDispute } from '@/lib/actions/artisan-jobs'
import { DISPUTE_REASONS, feeBreakdown, naira, type ArtisanJob, type DisputeOutcome, type JobDispute } from '@/lib/artisan-jobs'

type Row = JobDispute & { job: ArtisanJob; amount_kobo: number }

const name = (p: ArtisanJob['customer']) => p?.display_name || (p?.username ? `@${p.username}` : 'Unknown')

function DisputeCard({ d }: { d: Row }) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<DisputeOutcome>('refund')
  const [pct, setPct] = useState(50)
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()

  const artisanGross = outcome === 'release' ? d.amount_kobo : outcome === 'refund' ? 0 : Math.round((d.amount_kobo * pct) / 100)
  const { fee, net } = feeBreakdown(artisanGross, d.job.fee_bps)
  const refund = d.amount_kobo - artisanGross
  const openedBy = d.opened_by === d.job.customer_id ? 'customer' : 'artisan'

  function submit() {
    if (note.trim().length < 5) {
      toast.error('Write a short reason for the decision.')
      return
    }
    start(async () => {
      const res = await resolveJobDispute(d.id, outcome, pct, note)
      if (res.success) {
        toast.success('Dispute resolved and funds moved.')
        router.refresh()
      } else toast.error(res.error)
    })
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{d.job.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {name(d.job.customer)} hired {name(d.job.artisan)} · opened by the {openedBy} ·{' '}
            {new Date(d.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">{naira(d.amount_kobo)}</p>
          <Link
            href={`/app/artisans/jobs/${d.job_id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Job and timeline <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm">
        <p className="font-medium text-foreground">{DISPUTE_REASONS[d.reason]}</p>
        <p className="mt-1 whitespace-pre-line text-muted-foreground">{d.details}</p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Decision">
          {(['refund', 'split', 'release'] as DisputeOutcome[]).map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={outcome === o}
              onClick={() => setOutcome(o)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                outcome === o
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {o === 'refund' ? 'Refund customer' : o === 'release' ? 'Pay artisan' : 'Split'}
            </button>
          ))}
        </div>

        {outcome === 'split' && (
          <label className="block text-sm text-foreground">
            Artisan share: <span className="font-semibold">{pct}%</span>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>
        )}

        <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-border p-3 text-center text-xs">
          <div>
            <dt className="text-muted-foreground">Customer gets</dt>
            <dd className="mt-0.5 font-bold text-foreground">{naira(refund)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Artisan gets</dt>
            <dd className="mt-0.5 font-bold text-foreground">{naira(net)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fee</dt>
            <dd className="mt-0.5 font-bold text-foreground">{naira(fee)}</dd>
          </div>
        </dl>

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for the decision (both parties will see this)"
          className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Button className="h-11 w-full" disabled={pending} onClick={submit}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve and move funds'}
        </Button>
      </div>
    </article>
  )
}

export default function DisputesQueueClient({ disputes }: { disputes: Row[] }) {
  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Open disputes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oldest first. Each decision moves escrow money immediately and can’t be undone.
        </p>
      </div>
      {disputes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-14 text-center">
          <Scale className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">No open disputes</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {disputes.map((d) => (
            <DisputeCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  )
}
