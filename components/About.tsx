import Image from 'next/image'
import { MapPin, ShieldCheck, HeartHandshake } from 'lucide-react'

const values = [
  {
    icon: HeartHandshake,
    title: 'Community first',
    description: 'Every decision starts with one question: does this help Nigerian communities?',
  },
  {
    icon: ShieldCheck,
    title: 'Measurable impact',
    description: 'We measure what matters: people connected, skills learned, businesses started and jobs filled.',
  },
  {
    icon: MapPin,
    title: 'Works for everyone',
    description: 'Built to run well on any phone, in every state and across any connection speed.',
  },
]

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white pb-20 pt-24 lg:pb-24 lg:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">About us</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Built in Nigeria, for Nigerians.
            </h2>
            <div className="mt-6 space-y-4 text-base sm:text-lg leading-relaxed text-ink-soft">
              <p>
                We started with a simple question: why should a market trader in Kano and a software
                engineer in Lagos need different apps to meet their people, learn a skill, sell their
                work and find their next job?
              </p>
              <p>
                Hubnovo is our answer. One unified platform that respects how Nigerians actually live,
                work, trade, and build cooperative wealth together.
              </p>
            </div>
          </div>

          {/* Panoramic photo card celebrating Nigerian innovators & builders */}
          <div className="relative group overflow-hidden rounded-3xl shadow-2xl border border-line bg-mist aspect-[16/10]">
            <Image
              src="/images/landing/about-innovators.jpg"
              alt="Nigerian innovators, creators, and entrepreneurs collaborating"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-xs font-bold uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5" /> All 36 States & FCT
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold">
                From Kano to Lagos, Port Harcourt to Enugu
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                Connecting traders, developers, artisans, and students into one unstoppable economic engine.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon
            return (
              <div key={v.title} className="rounded-2xl border border-line bg-mist/50 p-6 sm:p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{v.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
