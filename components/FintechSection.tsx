import Link from 'next/link'
import { ArrowRight, Check, Lock, ShieldCheck } from 'lucide-react'

// Product visuals are illustrative UI renders, not live data.

function SafeVisual() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">Rent 2027</span>
          <span className="text-slate-500">54%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-full w-[54%] rounded-full bg-brand" />
        </div>
        <p className="mt-2 text-xs text-slate-500">₦650,000 of ₦1,200,000</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mist">
          <Lock className="h-4 w-4 text-ink" />
        </span>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-ink">Locked savings</p>
          <p className="text-xs text-slate-500">Unlocks 14 Dec</p>
        </div>
        <span className="text-sm font-semibold text-ink">₦240,000</span>
      </div>
    </div>
  )
}

function AjoVisual() {
  const members = [
    { initials: 'AO', status: 'Paid out', done: true },
    { initials: 'ZH', status: 'Paid out', done: true },
    { initials: 'CO', status: 'This month', current: true },
    { initials: 'EO', status: 'Next' },
  ]
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Payout order</p>
        <p className="text-xs text-slate-500">₦20,000 / month</p>
      </div>
      <ol className="mt-3 space-y-2">
        {members.map((m, i) => (
          <li
            key={m.initials}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${m.current ? 'bg-brand/[0.07]' : ''}`}
          >
            <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
              {m.initials}
            </span>
            <span className="flex-1 text-sm text-ink">{m.status}</span>
            {m.done && <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />}
          </li>
        ))}
      </ol>
    </div>
  )
}

function CredVisual() {
  // semicircle gauge: 742 of 1000
  const r = 70
  const circ = Math.PI * r
  const pct = 0.742
  return (
    <div className="flex flex-col items-center rounded-xl bg-white p-5 shadow-sm">
      <svg viewBox="0 0 180 100" className="w-48">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M20 90 A70 70 0 0 1 160 90"
          fill="none"
          stroke="currentColor"
          className="text-brand"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
        />
      </svg>
      <p className="-mt-9 font-display text-3xl font-bold text-ink">742</p>
      <p className="text-xs text-slate-500">out of 1000 · Good</p>
    </div>
  )
}

function CreditVisual() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">Loan offer</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">₦150,000</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {['1 month', '3 months', '6 months'].map((t, i) => (
          <span
            key={t}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
              i === 1 ? 'border-brand bg-brand/[0.07] text-brand' : 'border-line text-ink-soft'
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-slate-500">Monthly repayment</span>
        <span className="font-semibold text-ink">₦53,500</span>
      </div>
    </div>
  )
}

function InsureVisual() {
  const policies = [
    { name: 'Health Basic', status: 'Active' },
    { name: 'Shop & Stock', status: 'Active' },
    { name: 'Device Cover', status: 'Claim in review' },
  ]
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      {policies.map((p, i) => (
        <div
          key={p.name}
          className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}
        >
          <ShieldCheck className="h-4 w-4 text-ink" />
          <span className="flex-1 text-sm font-medium text-ink">{p.name}</span>
          <span className="text-xs text-slate-500">{p.status}</span>
        </div>
      ))}
    </div>
  )
}

const products = [
  {
    name: 'NaijaSafe',
    title: 'Save for what matters, at your pace.',
    description:
      'Flexible savings you can withdraw anytime, locked savings with interest, and goals that track your progress for you.',
    visual: SafeVisual,
  },
  {
    name: 'NaijaAjo',
    title: 'The ajo you trust, without the paper records.',
    description:
      'Start or join a digital savings circle of 2–20 members. Contributions, payout order and disputes are all tracked in one place.',
    visual: AjoVisual,
  },
  {
    name: 'TradeCred',
    title: 'A credit score that sees what banks miss.',
    description:
      'Your savings, transactions and ajo history build a score from 0 to 1000, with a clear breakdown and tips to improve it.',
    visual: CredVisual,
  },
  {
    name: 'NaijaCredit',
    title: 'Micro-loans based on how you actually save.',
    description:
      'Apply using your TradeCred score, choose a tenure that fits, and track every repayment in the app.',
    visual: CreditVisual,
  },
  {
    name: 'NaijaInsure',
    title: 'Affordable cover for everyday life.',
    description:
      'Browse micro-insurance plans, pay premiums from your wallet, and file claims with documents, without paperwork queues.',
    visual: InsureVisual,
  },
]

export default function FintechSection() {
  return (
    <section id="products" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Products</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Everything your money needs, in one account.
            </h2>
          </div>
          <p className="max-w-lg text-lg leading-relaxed text-ink-soft lg:justify-self-end">
            Five products that work together. Your savings grow your credit score, and your
            credit score opens up better loans.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {products.map((product, i) => {
            const Visual = product.visual
            // 3 on top row (2 cols each), 2 on bottom row (3 cols each)
            const span = i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
            return (
              <article
                key={product.name}
                className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-white ${span}`}
              >
                {/* fixed-height visual on top keeps every card in a row aligned */}
                <div className="flex h-[340px] items-center justify-center bg-mist px-7">
                  <div className="w-full max-w-sm">
                    <Visual />
                  </div>
                </div>
                <div className="p-7">
                  <p className="text-sm font-semibold text-brand">{product.name}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">
                    {product.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                    {product.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand hover:text-brand-deep"
          >
            Open your free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
