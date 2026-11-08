import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import PhoneFrame from '@/components/illustrations/PhoneFrame'

// The four core experiences, each shown with a real screenshot of the app
// in mobile view (public/landing/).

const features = [
  {
    id: 'community',
    eyebrow: 'Community',
    title: 'Your people, all in one feed.',
    description:
      'Post updates, photos and videos, follow people whose work you admire and join the conversations that matter to you.',
    points: [
      'Topic feeds for the things you care about',
      'Direct messages and group chats',
      'Go live and stream to your followers',
    ],
    image: '/landing/community.png',
    alt: 'The Hubnovo community feed on a phone',
  },
  {
    id: 'learn',
    eyebrow: 'Learn',
    title: 'Pick up skills that pay.',
    description:
      'Take courses at your own pace, from business basics to digital skills, and track your progress lesson by lesson.',
    points: [
      'Video lessons you can take anywhere',
      'Progress saved as you go',
      'Courses from people in the community',
    ],
    image: '/landing/learn.png',
    alt: 'Courses in the Hubnovo Learn hub on a phone',
  },
  {
    id: 'marketplace',
    eyebrow: 'Marketplace',
    title: 'Sell what you make. Find what you need.',
    description:
      'Open a storefront, list your products and services, and reach buyers in the community. Hire trusted artisans and pros near you.',
    points: [
      'Your own storefront in minutes',
      'Products, services and artisans in one place',
      'Orders and messages with buyers in the app',
    ],
    image: '/landing/marketplace.png',
    alt: 'The Hubnovo marketplace on a phone',
  },
  {
    id: 'jobs',
    eyebrow: 'Jobs & Careers',
    title: 'Your next opportunity is here.',
    description:
      'Browse jobs from employers in the community, apply in a few taps and keep track of every application. Hiring? Post a job for free.',
    points: [
      'Remote, hybrid and on-site roles',
      'Apply and track applications in one place',
      'Post jobs and review applicants',
    ],
    image: '/landing/jobs.png',
    alt: 'Job listings on Hubnovo on a phone',
  },
]

export default function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-20 overflow-x-clip bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">What you can do</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            Everything your community needs, in one app.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Connect with people, learn new skills, buy and sell, and find work, without switching
            between five different apps.
          </p>
        </div>

        <div className="mt-20 space-y-24 lg:space-y-32">
          {features.map((f, i) => (
            <article
              key={f.id}
              id={f.id}
              className="grid scroll-mt-24 items-center gap-12 lg:grid-cols-2 lg:gap-20"
            >
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">{f.eyebrow}</p>
                <h3 className="mt-4 text-balance font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
                  {f.title}
                </h3>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">{f.description}</p>
                <ul className="mt-7 space-y-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-[15px] text-ink">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Check className="h-3 w-3 text-brand" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`relative flex justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                {/* same quiet ring backdrop as the hero */}
                <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mist" />
                <PhoneFrame src={f.image} alt={f.alt} className="relative" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand hover:text-brand-deep"
          >
            Join Hubnovo for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
