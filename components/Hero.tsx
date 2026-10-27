import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

const assurances = ['Free to join', 'Verified accounts', 'Built in Nigeria']

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist pt-16 lg:pt-[72px]">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            Community · Learn · Marketplace · Jobs
          </p>

          <h1 className="mt-5 text-balance font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
            Connect, learn and grow with your people.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Hubnovo brings your community, courses, marketplace and job board into one app. Meet
            people doing what you do, pick up new skills, sell what you make and find your next
            opportunity. Built in Nigeria, for Nigerians.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-ink/15 bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink/30"
            >
              Explore the app
            </Link>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          {/* quiet backdrop — two solid rings, no blur */}
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white lg:left-[58%]" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/[0.06] lg:left-[58%]" />
          <PhoneFrame
            src="/landing/home.png"
            alt="The Hubnovo home screen on a phone"
            priority
            className="relative lg:mr-10"
          />
        </div>
      </div>
    </section>
  )
}
