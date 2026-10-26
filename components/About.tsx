const values = [
  {
    title: 'Community first',
    description: 'Every decision starts with one question: does this help Nigerian communities?',
  },
  {
    title: 'Measurable impact',
    description: 'We measure what matters: people connected, skills learned, businesses started and jobs filled.',
  },
  {
    title: 'Works for everyone',
    description: 'Built to run well on any phone and any connection speed.',
  },
]


export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white pb-20 pt-24 lg:pb-24 lg:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">About us</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Built in Nigeria, for Nigerians.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              We started with a simple question: why should a market trader in Kano and a software
              engineer in Lagos need different apps to meet their people, learn a skill, sell their
              work and find their next job?
            </p>
            <p>
              Hubnovo is our answer. One platform that respects how Nigerians actually live, work
              and support each other.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title}>
              <h3 className="font-display text-lg font-semibold text-ink">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
