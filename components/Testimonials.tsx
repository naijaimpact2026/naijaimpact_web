import Image from 'next/image'
import { Star, BadgeCheck, MapPin } from 'lucide-react'

const testimonials = [
  {
    name: 'Aisha Musa',
    role: 'Market trader, Kasuwar Kurmi',
    location: 'Kano, Nigeria',
    image: '/images/testimonials/aisha-musa.jpg',
    product: 'NaijaAjo Circle',
    rating: 5,
    quote:
      'My ajo group switched from paper records to Hubnovo. No more arguments about who paid and who did not. Everything is on the app, transparent and secure.',
  },
  {
    name: 'Adebayo Oluwaseun',
    role: 'Tech Entrepreneur, Bodija',
    location: 'Ibadan, Nigeria',
    image: '/images/testimonials/adebayo-oluwaseun.jpg',
    product: 'TradeCred & Loans',
    rating: 5,
    quote:
      'My TradeCred score got me the microloan I needed to restock our hardware inventory. No commercial bank in Nigeria would have approved me that fast.',
  },
  {
    name: 'Emeka Obi',
    role: 'Startup founder & CEO',
    location: 'Port Harcourt, Nigeria',
    image: '/images/testimonials/emeka-obi.jpg',
    product: 'NaijaSafe Lock',
    rating: 5,
    quote:
      'I use NaijaSafe to lock away our startup runway funds so we are never tempted by impulse spending. Safe locked savings with real interest is exactly what founders need.',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 bg-mist py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Stories</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Built with the people who use it.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-soft">
              Real Nigerian traders, tech founders, and artisans growing together on Hubnovo.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 border border-line shadow-xs">
            <div className="flex -space-x-2">
              {testimonials.map((t) => (
                <div key={t.name} className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white ring-1 ring-brand/20">
                  <Image src={t.image} alt={t.name} fill className="object-cover" sizes="32px" />
                </div>
              ))}
            </div>
            <div className="text-xs font-semibold text-ink pl-1">
              <span className="text-brand font-bold">50,000+</span> active members
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="group flex flex-col justify-between rounded-3xl border border-line bg-white p-7 shadow-xs hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                    {t.product}
                  </span>
                </div>

                <blockquote className="text-[16px] sm:text-[17px] leading-relaxed text-ink font-medium">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              <figcaption className="mt-8 flex items-center gap-3.5 border-t border-line pt-6">
                <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden ring-2 ring-brand/20 shadow-sm">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="block text-sm font-bold text-ink truncate">{t.name}</span>
                    <BadgeCheck className="h-4 w-4 text-brand shrink-0" />
                  </div>
                  <span className="block text-xs text-slate-500 truncate">{t.role}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{t.location}</span>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

