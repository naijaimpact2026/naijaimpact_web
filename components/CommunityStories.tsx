import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Quote, Star, Users, Briefcase, GraduationCap, ShoppingBag } from 'lucide-react'

interface Story {
  name: string
  location: string
  role: string
  category: string
  icon: typeof Users
  image: string
  quote: string
  metrics: string
}

const stories: Story[] = [
  {
    name: 'Amina Bello',
    location: 'Lagos State',
    role: 'Tech Community Host & Founder',
    category: 'Community & Audio Spaces',
    icon: Users,
    image: '/images/landing/feature-community.jpg',
    quote:
      'Hubnovo brought our developer network under one roof. We host live audio sessions, share code tutorials, and our members get discovered and hired directly through the ecosystem.',
    metrics: 'Grew community to 2,400+ members',
  },
  {
    name: 'Emeka Okafor',
    location: 'Enugu State',
    role: 'Master Electrician & Pro',
    category: 'Artisans & Pros',
    icon: Briefcase,
    image: '/images/community/skilled-artisan-workshop.jpg',
    quote:
      'Before Hubnovo, finding clients who pay promptly on milestone delivery was tough. The verified badge and milestone escrow gave clients immediate peace of mind to book my team.',
    metrics: '28 verified milestone jobs completed',
  },
  {
    name: 'Fatima Kabir',
    location: 'Kano State',
    role: 'Bespoke Tailor & Boutique Owner',
    category: 'Marketplace & Storefront',
    icon: ShoppingBag,
    image: '/images/landing/feature-marketplace.jpg',
    quote:
      'Opening my digital storefront took less than five minutes. Selling bespoke adire garments to customers in Abuja, Lagos, and Port Harcourt has doubled my monthly earnings.',
    metrics: 'Over ₦1.8M in processed orders',
  },
  {
    name: 'Tunde Adeleke',
    location: 'Oyo State',
    role: 'UI/UX Designer & Learn Graduate',
    category: 'Learn & Job Board',
    icon: GraduationCap,
    image: '/images/landing/feature-jobs.jpg',
    quote:
      'I completed my product design track on the Learn hub, shared my case studies with the community, and landed my first remote design gig through the Hubnovo Job Board.',
    metrics: 'Hired within 3 weeks of graduation',
  },
]

const stats = [
  { value: '15,000+', label: 'Active Members', sub: 'Across all 36 states' },
  { value: '1,200+', label: 'Verified Artisans', sub: 'Escrow-backed trust' },
  { value: '450+', label: 'Courses & Masterclasses', sub: 'Taught by local experts' },
  { value: '98.6%', label: 'Satisfaction Rate', sub: 'Zero-dispute payouts' },
]

export default function CommunityStories() {
  return (
    <section id="stories" className="scroll-mt-20 bg-mist py-24 lg:py-32 overflow-hidden border-y border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Real People · Real Growth</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Built by Nigerians, for the way we thrive.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Every day, creators, technicians, store owners, and learners turn ideas into livelihoods on Hubnovo.
            </p>
          </div>

          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 self-start lg:self-auto rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep shadow-md"
          >
            Join the community
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Stories Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((story) => {
            const Icon = story.icon
            return (
              <article
                key={story.name}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-xs hover:shadow-xl hover:border-brand/30 transition-all duration-300"
              >
                <div>
                  {/* Photo Header with verified indicator */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-mist mb-4">
                    <Image
                      src={story.image}
                      alt={story.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-ink shadow-sm">
                        <CheckCircle2 className="h-3 w-3 text-brand fill-brand/20" />
                        Verified
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {story.category}
                      </p>
                      <p className="text-xs font-semibold text-white/90 truncate">{story.location}</p>
                    </div>
                  </div>

                  {/* Member Bio */}
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">{story.name}</h3>
                    <p className="text-xs font-medium text-ink-soft">{story.role}</p>
                  </div>

                  {/* Quote */}
                  <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-ink-soft line-clamp-4 italic">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>

                {/* Outcome Pill */}
                <div className="mt-4 pt-3 border-t border-line/80 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-brand">{story.metrics}</span>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Community Stats Bar */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 rounded-2xl bg-white p-6 sm:p-8 border border-line shadow-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-brand tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm font-bold text-ink mt-0.5">{stat.label}</p>
              <p className="text-xs text-ink-soft mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
