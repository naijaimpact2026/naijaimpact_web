import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const steps = [
  {
    title: 'Create your account',
    description: 'Sign up with your email or Google. It takes about two minutes and costs nothing.',
  },
  {
    title: 'Verify and set your PIN',
    description: 'Confirm your email with a one-time code and set the PIN that protects every payment.',
  },
  {
    title: 'Start saving with your people',
    description: 'Fund your wallet, set a savings goal or join an ajo circle, and watch your score grow.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">How it works</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Up and running in three steps.
            </h2>
          </div>
          <Link
            href="/auth/signup"
            className="group inline-flex h-12 w-fit items-center gap-2 rounded-lg bg-ink px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t-2 border-ink pt-6">
              <span className="font-display text-sm font-semibold text-brand">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
