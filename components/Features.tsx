import { Radio, MessageCircle, Wrench, Rocket, Search, BookOpenCheck } from 'lucide-react'

// Live features beyond the four headline ones in FeatureShowcase.
const features = [
  {
    icon: Radio,
    title: 'Livestream',
    description:
      'Watch creators live, react and chat in real time, and catch replays of the broadcasts you missed.',
  },
  {
    icon: MessageCircle,
    title: 'Chat and groups',
    description:
      'Direct messages and group chats for your team, your customers or your study group.',
  },
  {
    icon: Wrench,
    title: 'Artisans & Pros',
    description:
      'Find tailors, electricians, designers and other skilled pros, or list your own services.',
  },
  {
    icon: Rocket,
    title: 'Business LaunchPad',
    description:
      'Set up your business profile and get help registering it with the CAC, step by step.',
  },
  {
    icon: BookOpenCheck,
    title: 'Teach a course',
    description:
      'Share what you know. Create a course with video lessons and publish it to the community.',
  },
  {
    icon: Search,
    title: 'One search for everything',
    description: 'Find people, posts, courses and jobs from a single search bar.',
  },
]

export default function Features() {
  return (
    <section id="more" className="scroll-mt-20 bg-mist py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">More on Hubnovo</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            And plenty more to explore.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Everything below is live in the app today, free with your account.
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
