import { Radio, MessageCircle, Rocket, Search, BookOpenCheck } from 'lucide-react'

// Live features beyond the five headline ones in FeatureShowcase.
const features = [
  {
    icon: Radio,
    title: 'Livestream',
    description: 'Watch creators live and catch replays.',
  },
  {
    icon: MessageCircle,
    title: 'Chat and Groups',
    description: 'Message your team, customers or study group.',
  },
  {
    icon: Rocket,
    title: 'Business LaunchPad',
    description: 'Register your business with the CAC, step by step.',
  },
  {
    icon: BookOpenCheck,
    title: 'Teach a Course',
    description: 'Share what you know with the community.',
  },
  {
    icon: Search,
    title: 'One Search',
    description: 'Find people, posts, courses and jobs in one place.',
  },
]

export default function Features() {
  return (
    <section id="more" className="scroll-mt-20 bg-mist py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Explore more</p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
          And plenty more to explore.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5 [&>*]:bg-white">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`p-7 ${i === features.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
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
