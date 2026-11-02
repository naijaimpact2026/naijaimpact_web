import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Sparkles, Users } from 'lucide-react'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

const assurances = ['Free to join', 'Verified accounts', 'Built in Nigeria']

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist pt-16 lg:pt-[72px]">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          {/* Community Social Proof Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink shadow-xs border border-line mb-5">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="relative h-6 w-6 rounded-full ring-2 ring-white overflow-hidden bg-brand/10">
                <Image src="/images/landing/feature-community.jpg" alt="Member" fill className="object-cover" />
              </div>
              <div className="relative h-6 w-6 rounded-full ring-2 ring-white overflow-hidden bg-brand/10">
                <Image src="/images/landing/feature-learn.jpg" alt="Member" fill className="object-cover" />
              </div>
              <div className="relative h-6 w-6 rounded-full ring-2 ring-white overflow-hidden bg-brand/10">
                <Image src="/images/landing/feature-marketplace.jpg" alt="Member" fill className="object-cover" />
              </div>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
            <span className="text-ink-soft">Join <strong className="text-ink font-bold">15,000+</strong> Nigerians connected</span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            Community · Learn · Marketplace · Jobs
          </p>

          <h1 className="mt-4 text-balance font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
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
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep shadow-md hover:shadow-lg"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-ink/15 bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink/30 shadow-xs"
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

        <div className="relative flex justify-center lg:justify-end items-center">
          {/* Quiet backdrop ring */}
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white lg:left-[58%]" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/[0.06] lg:left-[58%]" />

          {/* Human photographic card positioned behind and to the left of the phone */}
          <div className="hidden sm:block absolute -left-4 md:-left-10 top-6 z-0 w-64 md:w-72 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-3 hover:rotate-0 transition-transform duration-500 group">
            <Image
              src="/images/landing/hero-community-humans.jpg"
              alt="Young Nigerians collaborating on Hubnovo"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand text-[9px] font-black uppercase tracking-wider mb-1">
                <Users className="w-2.5 h-2.5" /> Community First
              </span>
              <p className="text-xs font-bold tracking-tight">Lagos Innovators & Creators</p>
              <p className="text-[10px] text-white/80">Connecting & growing together</p>
            </div>
          </div>

          {/* Center Phone Frame */}
          <div className="relative z-10 scale-[0.95] sm:scale-100 lg:mr-6">
            <PhoneFrame
              src="/landing/home.png"
              alt="The Hubnovo home screen on a phone"
              priority
              className="relative drop-shadow-2xl"
            />
          </div>

          {/* Floating live community engagement badge */}
          <div className="absolute -bottom-3 right-2 sm:right-0 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-line">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-black text-ink leading-none">Live Networking</p>
              <p className="text-[10px] text-ink-soft mt-0.5">Discussions, classes & gigs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
