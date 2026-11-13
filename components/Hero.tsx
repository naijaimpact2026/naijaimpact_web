import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import DashboardFrame from '@/components/illustrations/DashboardFrame'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist pt-16 lg:pt-[72px]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:px-8 lg:pt-16">
        <div className="max-w-xl lg:pb-16">
          <h1 className="text-balance font-display text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[3.5rem] xl:text-[4rem]">
            Connect, learn and grow with your people.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
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

        {/* Desktop dashboard, sitting on the bottom edge of the hero and fading
            out there (and running off the right edge on smaller desktops) so
            the eye lands on the welcome card and quick links. Scaled down on
            small screens so the sidebar and content both show. */}
        <div className="relative self-end">
          <div
            className="absolute -inset-x-10 top-0 h-[420px] rounded-full bg-brand/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative h-[250px] overflow-hidden sm:h-[360px] lg:h-[540px] lg:w-[760px]">
            <DashboardFrame className="origin-top-left scale-[0.45] min-[400px]:scale-50 sm:scale-75 lg:scale-100" />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-mist to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
