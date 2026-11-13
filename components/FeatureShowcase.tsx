import Image from 'next/image'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

// The five core experiences: picture first, a few words each.
// Screenshots are real captures of the app in mobile view (public/landing/).

interface Feature {
  id: string
  title: string
  tagline: string
  caption: string
  image: string
  alt: string
  /** true = app screenshot in a phone frame; false = full-bleed photo */
  screenshot: boolean
}

const features: Feature[] = [
  {
    id: 'community',
    title: 'Community',
    tagline: 'Your people, in one feed.',
    caption: 'Your community feed',
    image: '/landing/community.png',
    alt: 'The Hubnovo community feed on a phone',
    screenshot: true,
  },
  {
    id: 'learn',
    title: 'Learn',
    tagline: 'Pick up skills that pay.',
    caption: 'Courses at your pace',
    image: '/landing/learn.png',
    alt: 'Courses in the Hubnovo Learn hub on a phone',
    screenshot: true,
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    tagline: 'Sell what you make.',
    caption: 'Your own storefront',
    image: '/landing/marketplace.png',
    alt: 'The Hubnovo marketplace on a phone',
    screenshot: true,
  },
  {
    id: 'artisans',
    title: 'Artisans & Pros',
    tagline: 'Hire trusted pros near you.',
    caption: 'Verified artisans and pros',
    // TODO: swap for /landing/artisans.png once a screenshot of the
    // Artisans & Services hub is captured (390×844, mobile view).
    image: '/images/community/skilled-artisan-workshop.jpg',
    alt: 'A skilled artisan at work in a workshop',
    screenshot: false,
  },
  {
    id: 'jobs',
    title: 'Jobs & Careers',
    tagline: 'Find your next opportunity.',
    caption: 'Jobs in a few taps',
    image: '/landing/jobs.png',
    alt: 'Job listings on Hubnovo on a phone',
    screenshot: true,
  },
]

export default function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">What you can do</p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
          One app. Five ways to grow.
        </h2>

        {/* Swipe row on phones and tablets, five columns on desktop */}
        <div className="-mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {features.map((f) => (
            <article key={f.id} id={f.id} className="w-[250px] shrink-0 snap-start scroll-mt-24 lg:w-auto">
              <div className="relative h-[340px] overflow-hidden rounded-2xl bg-mist">
                {f.screenshot ? (
                  <div className="absolute inset-x-0 top-16 flex justify-center">
                    <PhoneFrame src={f.image} alt={f.alt} size="sm" />
                  </div>
                ) : (
                  <>
                    <Image src={f.image} alt={f.alt} fill sizes="250px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                  </>
                )}
                <p
                  className={`absolute left-5 right-5 top-5 font-display text-[15px] font-semibold ${
                    f.screenshot ? 'text-ink' : 'text-white'
                  }`}
                >
                  {f.caption}
                </p>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-[15px] text-ink-soft">{f.tagline}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
