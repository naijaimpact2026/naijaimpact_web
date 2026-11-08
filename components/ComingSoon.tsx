import Link from 'next/link'
import { ArrowRight, PiggyBank, Users, Gauge, HandCoins } from 'lucide-react'

// Money features that are being built — shown honestly as "Coming soon",
// nothing here is usable yet.
const upcoming = [
  {
    icon: PiggyBank,
    name: 'Savings & Wallet',
    description: 'Save towards your goals and keep money for the things you buy on Hubnovo in one wallet.',
  },
  {
    icon: Users,
    name: 'Ajo circles',
    description: 'Run your contribution circle digitally, with every payment and payout on record.',
  },
  {
    icon: Gauge,
    name: 'Credit & micro-loans',
    description: 'A credit score built from your activity, and small loans that match how you save.',
  },
  {
    icon: HandCoins,
    name: 'Crowdfunding',
    description: 'Raise money for community projects and causes, with progress anyone can follow.',
  },
]

export default function ComingSoon() {
  return (
    <section id="coming-soon" className="scroll-mt-20 bg-ink py-24 text-white lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">Coming soon</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
              Money tools, built for the way we save together.
            </h2>
          </div>
          <p className="max-w-lg text-lg leading-relaxed text-slate-300 lg:justify-self-end">
            We&apos;re building savings, ajo, credit and crowdfunding into Hubnovo. Create your
            account now and you&apos;ll be first to know when each one opens.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map(({ icon: Icon, name, description }) => (
            <div key={name} className="bg-ink p-8">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  Soon
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold">{name}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-300">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/auth/signup"
            className="group inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-slate-100"
          >
            Create your account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
