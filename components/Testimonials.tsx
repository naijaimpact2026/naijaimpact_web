'use client'

import React from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Chioma Okafor',
    role: 'Community Leader',
    location: 'Lagos',
    initials: 'CO',
    hue: 340,
    quote:
      'Hubnovo replaced three apps I was using. The ajo feature alone saved our group so many arguments — everything is tracked and transparent now.',
    rating: 5,
  },
  {
    name: 'Adebayo Oluwaseun',
    role: 'Tech Entrepreneur',
    location: 'Ibadan',
    initials: 'AO',
    hue: 220,
    quote:
      'My TradeCred score got me a microloan I needed to restock inventory. No bank would have approved me that fast. This is the future.',
    rating: 5,
  },
  {
    name: 'Zainab Hassan',
    role: 'NGO Director',
    location: 'Kano',
    initials: 'ZH',
    hue: 38,
    quote:
      'We raised ₦4.5 million for our school renovation through the crowdfunding feature. The progress bar kept our donors motivated all the way to the goal.',
    rating: 5,
  },
  {
    name: 'Chidiebere Nwosu',
    role: 'Freelance Designer',
    location: 'Enugu',
    initials: 'CN',
    hue: 160,
    quote:
      'I listed my design services and got three clients through the marketplace in my first week. The chat integration makes client communication seamless.',
    rating: 5,
  },
  {
    name: 'Fatima Aliyu',
    role: 'Youth Coordinator',
    location: 'Abuja',
    initials: 'FA',
    hue: 270,
    quote:
      'The learning platform is genuinely good. Our youth group completed a financial literacy course together and the completion badges kept everyone accountable.',
    rating: 5,
  },
  {
    name: 'Emeka Obi',
    role: 'Startup Founder',
    location: 'Port Harcourt',
    initials: 'EO',
    hue: 195,
    quote:
      'I use NaijaSafe to lock away runway funds so I am not tempted to spend them. The locked savings with interest is basically a savings product most banks charge for.',
    rating: 5,
  },
  {
    name: 'Aisha Musa',
    role: 'Market Trader',
    location: 'Kano',
    initials: 'AM',
    hue: 15,
    quote:
      'My ajo group switched from paper records to Hubnovo. No more arguments about who paid and who did not. Everything is on the app.',
    rating: 5,
  },
  {
    name: 'Tunde Adeleke',
    role: 'Teacher',
    location: 'Abeokuta',
    initials: 'TA',
    hue: 130,
    quote:
      'I published my first online course on Hubnovo and earned ₦180,000 in the first month. The platform makes creators feel valued.',
    rating: 5,
  },
]

function TestimonialCard({ t }: { t: (typeof testimonials)[0] })
{
  return (
    <div className="flex-shrink-0 w-[320px] bento-card noise-bg p-6 mx-2">
      <Quote className="w-6 h-6 text-primary/25 mb-4" />

      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: `hsl(${t.hue}, 70%, 52%)` }}
        >
          {t.initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.role} · {t.location}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials()
{
  const doubled = [...testimonials, ...testimonials]

  return (
    <section id="testimonials" className="relative py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gray-50/90 dark:bg-slate-950/60" />

      <div className="container-gutter mx-auto max-w-7xl mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              Real Stories
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-gray-900 dark:text-white">Loved by</span>
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                50,000 Nigerians
              </span>
            </h2>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">4.9</div>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg rating</div>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">2K+</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee row */}
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-gray-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-gray-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="marquee-track py-2">
          {doubled.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
