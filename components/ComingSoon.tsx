import { PiggyBank, Users, Gauge, HandCoins } from 'lucide-react'

// Money features that are being built — shown honestly as "Soon",
// nothing here is usable yet.
const upcoming = [
  { icon: PiggyBank, name: 'Savings' },
  { icon: Users, name: 'Ajo Circles' },
  { icon: Gauge, name: 'Credit & Micro-loans' },
  { icon: HandCoins, name: 'Crowdfunding' },
]

export default function ComingSoon() {
  return (
    <section id="vision" className="scroll-mt-20 bg-ink py-24 text-white lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">Our vision</p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
          Money tools, built for the way we save together.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-300">
          We are building these features into Hubnovo:
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map(({ icon: Icon, name }) => (
            <div key={name} className="flex items-center justify-between gap-4 bg-ink p-7">
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 shrink-0 text-white" strokeWidth={1.75} />
                <h3 className="font-display text-lg font-semibold">{name}</h3>
              </div>
              <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
