import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import AppPhoneMockup from '@/components/illustrations/AppPhoneMockup'

const assurances = ['Free to join', 'Payments secured by Paystack', 'PIN-protected transfers']

const socialAvatars = [
  { src: '/images/avatars/chioma.jpg', alt: 'Chioma Okafor' },
  { src: '/images/testimonials/aisha-musa.jpg', alt: 'Aisha Musa' },
  { src: '/images/testimonials/adebayo-oluwaseun.jpg', alt: 'Adebayo Oluwaseun' },
  { src: '/images/avatars/fatima.jpg', alt: 'Fatima Aliyu' },
  { src: '/images/testimonials/emeka-obi.jpg', alt: 'Emeka Obi' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist pt-16 lg:pt-[72px]">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Savings · Ajo · Credit · Community</span>
          </div>

          <h1 className="mt-5 text-balance font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
            Save, borrow and grow with your people.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Hubnovo brings your savings, ajo circles, credit score and community into one secure
            app. Built in Nigeria, for the way Nigerians actually manage money together.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep shadow-md shadow-brand/20"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-ink/15 bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink/30"
            >
              See how it works
            </Link>
          </div>

          <ul className="mt-7 flex flex-col gap-2.5 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>

          {/* Authentic Nigerian Human Social Proof */}
          <div className="mt-8 flex items-center gap-3.5 pt-6 border-t border-line/80">
            <div className="flex -space-x-2.5">
              {socialAvatars.map((avatar, i) => (
                <div
                  key={avatar.alt}
                  className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white ring-1 ring-brand/25 shadow-xs"
                >
                  <Image
                    src={avatar.src}
                    alt={avatar.alt}
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority={i < 2}
                  />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-ink text-sm">
                <span>50,000+ Nigerians</span>
                <span className="text-amber-500 font-extrabold text-xs">★ 4.9</span>
              </div>
              <p className="text-slate-500 text-xs">Active members across 36 states</p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          {/* quiet backdrop — two solid rings, no blur */}
          <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white lg:left-[58%]" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/[0.06] lg:left-[58%]" />
          
          <div className="relative">
            <AppPhoneMockup className="relative lg:mr-10" />

            {/* Floating Live Community Proof with Aisha Musa's verified payout */}
            <div className="absolute -left-4 sm:-left-8 bottom-12 z-20 hidden sm:flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/30 shadow-xs">
                <Image
                  src="/images/testimonials/aisha-musa.jpg"
                  alt="Aisha Musa"
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-ink">₦200,000 Ajo Payout</p>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500">Aisha M. &bull; Kasuwar Kurmi, Kano</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

