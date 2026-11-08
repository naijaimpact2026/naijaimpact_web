import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist pt-16 lg:pt-[72px]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pt-20">
        <div className="max-w-2xl self-center lg:pb-28">
          <h1 className="text-balance font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
            Connect, learn and grow with your people.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Community, courses, marketplace and jobs in one app. Built in Nigeria, for Nigerians.
          </p>

          <div className="mt-9">
            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-3 text-sm text-ink-soft">Free to join.</p>
          </div>
        </div>

        {/* Top half of the phone only, cut off by the section edge, so the eye
            lands on the welcome card and the feature grid. */}
        <div className="relative flex justify-center self-end lg:justify-end">
          <div className="absolute left-1/2 top-10 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-white lg:left-[58%]" />
          <div className="relative h-[400px] overflow-hidden sm:h-[430px] lg:mr-10">
            <PhoneFrame src="/landing/home.png" alt="The Hubnovo home screen on a phone" priority />
          </div>
        </div>
      </div>
    </section>
  )
}
