import Image from 'next/image'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

// The five core experiences as a bento grid: two wide cards on top,
// three on the row below. Screenshots are real captures of the app in
// mobile view (public/landing/).

interface Feature {
  id: string
  eyebrow: string
  title: string
  tagline: string
  image: string
  alt: string
  /** true = app screenshot in a phone frame; false = full-bleed photo */
  screenshot: boolean
  /** grid span + when the card lays out side by side (text left, phone right) */
  layout: string
  /** not live yet: shows a "Coming soon" badge */
  comingSoon?: boolean
}

// Wide: spans the full row on tablets, half the row on desktop, side by side from md up.
const WIDE = 'md:col-span-2 lg:col-span-3 md:flex-row'
// Narrow: one third of the row on desktop, stacked.
const NARROW = 'lg:col-span-2'
// Last card fills the tablet row on its own, so it goes side by side there only.
const NARROW_LAST = 'md:col-span-2 md:flex-row lg:col-span-2 lg:flex-col'

const features: Feature[] = [
  {
    id: 'community',
    eyebrow: 'Community',
    title: 'Your people, in one feed.',
    tagline: 'Join communities, live audio rooms and conversations that move you forward.',
    image: '/landing/community.png',
    alt: 'The Hubnovo community feed on a phone',
    screenshot: true,
    layout: WIDE,
  },
  {
    id: 'learn',
    eyebrow: 'Learn',
    title: 'Pick up skills that pay.',
    tagline: 'Practical courses you can take at your own pace, on your phone.',
    image: '/landing/learn.png',
    alt: 'Courses in the Hubnovo Learn hub on a phone',
    screenshot: true,
    layout: WIDE,
  },
  {
    id: 'marketplace',
    eyebrow: 'Marketplace',
    title: 'Sell what you make.',
    tagline: 'Your own storefront in minutes.',
    image: '/landing/marketplace.png',
    alt: 'The Hubnovo marketplace on a phone',
    screenshot: true,
    layout: NARROW,
  },
  {
    id: 'artisans',
    eyebrow: 'Artisans & Pros',
    title: 'Hire trusted pros near you.',
    tagline: 'Verified artisans and service providers.',
    // Transparent cutout (same figure as the in-app Artisans hero), shown
    // on a brand-blue backdrop instead of a full-bleed photo.
    image: '/images/heroes/artisan-electrician.png',
    alt: 'A smiling electrician wearing a tool belt',
    screenshot: false,
    layout: NARROW,
    comingSoon: true,
  },
  {
    id: 'jobs',
    eyebrow: 'Jobs & Careers',
    title: 'Find your next opportunity.',
    tagline: 'Browse openings and apply in a few taps.',
    image: '/landing/jobs.png',
    alt: 'Job listings on Hubnovo on a phone',
    screenshot: true,
    layout: NARROW_LAST,
  },
]

function ScreenshotCard({ f }: { f: Feature }) {
  return (
    <article
      id={f.id}
      className={`relative flex h-[500px] scroll-mt-24 flex-col overflow-hidden rounded-3xl bg-mist ring-1 ring-ink/5 ${f.layout}`}
    >
      <div className="relative z-10 shrink-0 p-8 md:basis-1/2 md:p-10 lg:basis-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{f.eyebrow}</p>
        <h3 className="mt-3 text-balance font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink">
          {f.title}
        </h3>
        <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-ink-soft">{f.tagline}</p>
      </div>
      {/* Phone peeks up from the bottom edge; the card clips the rest */}
      <div className="flex flex-1 justify-center px-8 md:items-start md:pt-10">
        <PhoneFrame src={f.image} alt={f.alt} size="sm" hideAppBar />
      </div>
    </article>
  )
}

function PhotoCard({ f }: { f: Feature }) {
  return (
    <article
      id={f.id}
      className={`relative flex h-[500px] scroll-mt-24 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-deep ${f.layout}`}
    >
      {/* Soft glow behind the figure */}
      <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 top-16">
        <Image
          src={f.image}
          alt={f.alt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-contain object-bottom"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur">
        {f.comingSoon ? (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-brand" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12.25a.75.75 0 0 0-1.5 0V10c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V5.75Z"
                clipRule="evenodd"
              />
            </svg>
            Coming soon
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-brand" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </>
        )}
      </span>
      <div className="relative p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">{f.eyebrow}</p>
        <h3 className="mt-3 text-balance font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-white">
          {f.title}
        </h3>
        <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-white/80">{f.tagline}</p>
      </div>
    </article>
  )
}

export default function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">What you can do</p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
          One app. Five ways to grow.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          {features.map((f) =>
            f.screenshot ? <ScreenshotCard key={f.id} f={f} /> : <PhotoCard key={f.id} f={f} />,
          )}
        </div>
      </div>
    </section>
  )
}
