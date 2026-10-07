import { KeyRound, MailCheck, CreditCard, Lock } from 'lucide-react'

const points = [
  {
    icon: KeyRound,
    title: 'A PIN on every payment',
    description: 'Transfers and payments from your wallet need your personal transaction PIN.',
  },
  {
    icon: MailCheck,
    title: 'Verified accounts',
    description: 'Every new account is confirmed with a one-time code before it can be used.',
  },
  {
    icon: CreditCard,
    title: 'Payments by Paystack',
    description: 'Card and bank payments are processed by Paystack, a PCI DSS compliant provider.',
  },
  {
    icon: Lock,
    title: 'Encrypted connections',
    description: 'Everything between your device and Hubnovo travels over encrypted HTTPS.',
  },
]

export default function Security() {
  return (
    <section id="security" className="scroll-mt-20 bg-ink py-24 text-white lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">Security</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] sm:text-5xl">
            Your money and your data, protected.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
            Trust is the whole point of saving together. We build every feature with that in mind.
          </p>
        </div>

        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {points.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15">
                <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
