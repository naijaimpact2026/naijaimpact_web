import Image from 'next/image'
import { MapPin } from 'lucide-react'

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">About us</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            Built in Nigeria, for Nigerians.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Hubnovo is one platform where people meet, learn, trade and find work. Our mission is to
            connect communities and create opportunity in all 36 states and the FCT.
          </p>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-mist">
          <Image
            src="/images/landing/about-innovators.jpg"
            alt="Nigerian innovators, creators and entrepreneurs working together"
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className="absolute bottom-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <MapPin className="h-3.5 w-3.5" /> All 36 States & FCT
          </span>
        </div>
      </div>
    </section>
  )
}
