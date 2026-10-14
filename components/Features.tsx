import { Users, MessageCircle, BookOpen, Briefcase, HandCoins, Search } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Social feed',
    description:
      'Share posts, photos and videos, follow people you admire, and keep up with your communities.',
  },
  {
    icon: MessageCircle,
    title: 'Chat and groups',
    description:
      'Direct messages and group channels for your ajo circle, your team or your business.',
  },
  {
    icon: HandCoins,
    title: 'Crowdfunding',
    description:
      'Raise money for community projects and causes, with progress anyone can follow.',
  },
  {
    icon: BookOpen,
    title: 'Learn and earn',
    description:
      'Take free and paid courses, earn completion badges, or publish lessons and get paid.',
  },
  {
    icon: Briefcase,
    title: 'Services marketplace',
    description:
      'List your skills with clear pricing and get hired by people in the community.',
  },
  {
    icon: Search,
    title: 'One search for everything',
    description: 'Find people, posts and courses from a single search bar.',
  },
]

export default function Features() {
  return (
    <section id="community" className="scroll-mt-20 bg-mist py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Community</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            More than a wallet. A place to build together.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            The people you save with are the people you learn, work and grow with. Hubnovo keeps
            them all in one place.
          </p>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 [&>*]:bg-white gap-px">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="p-8">
              <Icon className="h-6 w-6 text-ink" strokeWidth={1.75} />
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
