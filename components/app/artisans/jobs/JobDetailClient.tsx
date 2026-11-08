'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Hammer,
  Loader2,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/toast'
import { approveJob, cancelJob, fundJob, openJobDispute, quoteJob, startJob, submitJob } from '@/lib/actions/artisan-jobs'
import {
  ARTISAN_DISPUTE_WAIT_DAYS,
  DISPUTE_REASONS,
  EVENT_LABELS,
  feeBreakdown,
  naira,
  PLATFORM_FEE_BPS,
  type DisputeReason,
  type JobDetail,
  type JobParty,
} from '@/lib/artisan-jobs'
import { DisputeDialog, JobStatusBadge, PinDialog } from './JobDialogs'

const card = 'rounded-3xl border border-border bg-card p-5 shadow-sm'

function partyName(p: JobParty | null | undefined) {
  return p?.display_name || (p?.username ? `@${p.username}` : 'Hubnovo user')
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export default function JobDetailClient({
  detail,
  walletBalanceNGN,
  hasPin,
}: {
  detail: JobDetail
  walletBalanceNGN: number
  hasPin: boolean
}) {
  const router = useRouter()
  const { job, hold, dispute, events, viewer } = detail
  const [pending, startTransition] = useTransition()
  const [pinFor, setPinFor] = useState<'fund' | 'approve' | null>(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [quote, setQuote] = useState(job.quote_kobo ? String(job.quote_kobo / 100) : '')
  const [quoteNote, setQuoteNote] = useState(job.quote_note ?? '')

  const isCustomer = viewer === 'customer'
  const isArtisan = viewer === 'artisan'
  const other = isCustomer ? job.artisan : job.customer
  const quoteKobo = Math.round((Number(quote) || 0) * 100)
  const take = feeBreakdown(quoteKobo, PLATFORM_FEE_BPS)
  const jobTake = job.quote_kobo ? feeBreakdown(job.quote_kobo, job.fee_bps) : null
  const shortOfFunds = job.quote_kobo ? job.quote_kobo / 100 > walletBalanceNGN : false

  const artisanCanDispute =
    isArtisan &&
    job.status === 'submitted' &&
    !!job.submitted_at &&
    Date.now() - new Date(job.submitted_at).getTime() > ARTISAN_DISPUTE_WAIT_DAYS * 86_400_000

  function run(action: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await action()
      if (res.success) {
        toast.success(ok)
        router.refresh()
      } else toast.error(res.error ?? 'Something went wrong.')
    })
  }

  async function withPin(pin: string): Promise<string | null> {
    const res = pinFor === 'fund' ? await fundJob(job.id, pin) : await approveJob(job.id, pin)
    if (!res.success) return res.error
    toast.success(
      pinFor === 'fund' ? 'Paid into escrow. The artisan has been notified.' : 'Approved. Payment released to the artisan.',
    )
    router.refresh()
    return null
  }

  async function submitDispute(reason: DisputeReason, details: string) {
    const res = await openJobDispute(job.id, reason, details)
    if (!res.success) return res.error
    toast.success('Dispute opened. Our team will review it.')
    router.refresh()
    return null
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      <Link
        href="/app/artisans/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My jobs
      </Link>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          {/* Summary */}
          <section className={card}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold text-foreground">{job.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isCustomer ? 'Artisan' : isArtisan ? 'Customer' : 'Customer → Artisan'}:{' '}
                  <span className="font-semibold text-foreground">
                    {viewer === 'admin' ? `${partyName(job.customer)} → ${partyName(job.artisan)}` : partyName(other)}
                  </span>
                </p>
              </div>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {job.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {job.address}
                </span>
              )}
              {job.preferred_date && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(job.preferred_date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
              {job.budget_kobo && <span>Customer budget: {naira(job.budget_kobo)}</span>}
            </div>
          </section>

          {/* Money */}
          {(job.quote_kobo || hold) && (
            <section className={card}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Payment</h2>
                {hold?.status === 'held' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Lock className="h-3.5 w-3.5" /> Held in escrow
                  </span>
                )}
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Quote</dt>
                  <dd className="font-bold text-foreground">{naira(job.quote_kobo)}</dd>
                </div>
                {jobTake && (isArtisan || viewer === 'admin') && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hubnovo fee ({job.fee_bps / 100}%)</dt>
                      <dd className="text-muted-foreground">−{naira(jobTake.fee)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <dt className="font-semibold text-foreground">Artisan receives</dt>
                      <dd className="font-bold text-foreground">{naira(jobTake.net)}</dd>
                    </div>
                  </>
                )}
                {hold && hold.status !== 'held' && (
                  <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    {hold.payee_kobo > 0 && <p>Paid to artisan: {naira(hold.payee_kobo)}</p>}
                    {hold.payer_refund_kobo > 0 && <p>Refunded to customer: {naira(hold.payer_refund_kobo)}</p>}
                  </div>
                )}
              </dl>
              {job.quote_note && <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-foreground/90">“{job.quote_note}”</p>}
            </section>
          )}

          {/* Dispute */}
          {dispute && (
            <section className={`${card} ${dispute.status === 'open' ? 'border-rose-500/30' : ''}`}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                {dispute.status === 'open' ? 'Dispute under review' : 'Dispute resolved'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{DISPUTE_REASONS[dispute.reason]}.</span> {dispute.details}
              </p>
              {dispute.status === 'open' ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  The payment stays in escrow until our team decides. We may contact both of you for more details.
                </p>
              ) : (
                dispute.resolution_note && (
                  <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">Decision: {dispute.resolution_note}</p>
                )
              )}
            </section>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Actions */}
          <ActionPanel>
            {/* Artisan: quote (or re-quote before payment) */}
            {isArtisan && (job.status === 'requested' || job.status === 'quoted') && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  run(
                    () => quoteJob(job.id, Number(quote), quoteNote),
                    job.status === 'quoted' ? 'Quote updated.' : 'Quote sent.',
                  )
                }}
              >
                <h2 className="text-sm font-semibold text-foreground">
                  {job.status === 'quoted' ? 'Update your quote' : 'Send a quote'}
                </h2>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={100}
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    aria-label="Quote amount in naira"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-8 pr-4 text-lg font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {quoteKobo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll receive <span className="font-semibold text-foreground">{naira(take.net)}</span> after the{' '}
                    {PLATFORM_FEE_BPS / 100}% Hubnovo fee ({naira(take.fee)}).
                  </p>
                )}
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="What's included, materials, how long it will take…"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-3">
                  <Button type="submit" className="h-11 flex-1" disabled={pending}>
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : job.status === 'quoted' ? (
                      'Update quote'
                    ) : (
                      'Send quote'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    disabled={pending}
                    onClick={() => run(() => cancelJob(job.id), 'Request declined.')}
                  >
                    Decline
                  </Button>
                </div>
              </form>
            )}

            {/* Customer: waiting for a quote */}
            {isCustomer && job.status === 'requested' && (
              <Waiting
                text={`Waiting for ${partyName(job.artisan)} to send a price.`}
                action={
                  <Button variant="outline" disabled={pending} onClick={() => run(() => cancelJob(job.id), 'Request cancelled.')}>
                    Cancel request
                  </Button>
                }
              />
            )}

            {/* Customer: accept and pay */}
            {isCustomer && job.status === 'quoted' && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Accept and pay {naira(job.quote_kobo)}</h2>
                <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  Your money is held in escrow. The artisan is only paid after you approve the finished work.
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Wallet balance:{' '}
                  <span className="font-semibold text-foreground">₦{walletBalanceNGN.toLocaleString('en-NG')}</span>
                </p>
                {shortOfFunds ? (
                  <Button asChild className="h-11 w-full">
                    <Link href="/app/wallet">Add money to your wallet</Link>
                  </Button>
                ) : (
                  <Button className="h-11 w-full" disabled={pending} onClick={() => setPinFor('fund')}>
                    Accept and pay {naira(job.quote_kobo)}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  disabled={pending}
                  onClick={() => run(() => cancelJob(job.id), 'Request cancelled.')}
                >
                  Cancel request
                </Button>
              </div>
            )}

            {/* Artisan: paid, start or finish */}
            {isArtisan && (job.status === 'funded' || job.status === 'in_progress') && (
              <div className="space-y-3">
                <p className="flex gap-2 text-sm text-foreground">
                  <Lock className="h-4 w-4 shrink-0 text-emerald-500" /> {naira(job.quote_kobo)} is secured in escrow for this
                  job.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {job.status === 'funded' && (
                    <Button
                      variant="outline"
                      className="h-11 flex-1"
                      disabled={pending}
                      onClick={() => run(() => startJob(job.id), 'Marked as started.')}
                    >
                      <Hammer className="h-4 w-4" /> Start work
                    </Button>
                  )}
                  <Button
                    className="h-11 flex-1"
                    disabled={pending}
                    onClick={() => run(() => submitJob(job.id), 'Sent to the customer for approval.')}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as done
                  </Button>
                </div>
                {job.status === 'funded' && (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    disabled={pending}
                    onClick={() => run(() => cancelJob(job.id), 'Job cancelled. The customer has been refunded.')}
                  >
                    Can&apos;t do this job? Cancel and refund
                  </Button>
                )}
              </div>
            )}

            {/* Customer: approve or dispute */}
            {isCustomer && ['funded', 'in_progress', 'submitted'].includes(job.status) && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {job.status === 'submitted' ? `${partyName(job.artisan)} says the work is done` : 'Work in progress'}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {job.status === 'submitted'
                    ? 'Check the work. Approve to release the payment, or report a problem if it isn’t right.'
                    : 'Approve only once you are happy with the finished work. This releases the payment.'}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="h-11 flex-1" disabled={pending} onClick={() => setPinFor('approve')}>
                    Approve and release {naira(job.quote_kobo)}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 border-rose-500/40 text-rose-600 hover:bg-rose-500/5 dark:text-rose-400"
                    disabled={pending}
                    onClick={() => setDisputeOpen(true)}
                  >
                    Report a problem
                  </Button>
                </div>
                {job.status === 'funded' && (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    disabled={pending}
                    onClick={() => run(() => cancelJob(job.id), 'Job cancelled and refunded to your wallet.')}
                  >
                    Cancel before work starts (full refund)
                  </Button>
                )}
              </div>
            )}

            {/* Artisan: waiting for approval */}
            {isArtisan && job.status === 'submitted' && (
              <Waiting
                text={
                  artisanCanDispute
                    ? 'The customer hasn’t responded. You can ask our team to step in.'
                    : `Waiting for ${partyName(job.customer)} to approve. If they don’t respond within ${ARTISAN_DISPUTE_WAIT_DAYS} days, you can open a dispute.`
                }
                action={
                  artisanCanDispute ? (
                    <Button variant="outline" onClick={() => setDisputeOpen(true)}>
                      Open a dispute
                    </Button>
                  ) : undefined
                }
              />
            )}

            {viewer === 'admin' && dispute?.status === 'open' && (
              <Button asChild className="w-full">
                <Link href="/app/admin/disputes">Resolve in the disputes queue</Link>
              </Button>
            )}
          </ActionPanel>

          {/* Timeline */}
          {events.length > 0 && (
            <section className={card}>
              <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
              <ol className="mt-4 space-y-4">
                {events.map((e, i) => (
                  <li key={e.id} className="flex gap-3">
                    {i === events.length - 1 ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <div>
                      <p className="text-sm text-foreground">{EVENT_LABELS[e.kind] ?? e.kind}</p>
                      {e.note && e.kind === 'submitted' && <p className="text-xs text-muted-foreground">{e.note}</p>}
                      <p className="text-xs text-muted-foreground">{fmtDateTime(e.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      <PinDialog
        open={pinFor !== null}
        onOpenChange={(v) => !v && setPinFor(null)}
        hasPin={hasPin}
        title={pinFor === 'fund' ? 'Pay into escrow' : 'Release payment'}
        description={
          pinFor === 'fund'
            ? `${naira(job.quote_kobo)} will move from your wallet into escrow.`
            : `${naira(job.quote_kobo)} will be released to ${partyName(job.artisan)}. This can’t be undone.`
        }
        confirmLabel={pinFor === 'fund' ? 'Pay' : 'Release payment'}
        onConfirm={withPin}
      />
      <DisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        reasons={isArtisan ? ['no_response', 'other'] : ['not_done', 'poor_quality', 'no_show', 'other']}
        onSubmit={submitDispute}
      />
    </div>
  )
}

function ActionPanel({ children }: { children: React.ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean)
  if (items.length === 0) return null
  return <section className={card}>{children}</section>
}

function Waiting({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin [animation-duration:3s]" /> {text}
      </p>
      {action}
    </div>
  )
}
