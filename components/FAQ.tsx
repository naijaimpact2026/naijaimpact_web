import { Plus } from 'lucide-react'

const faqs = [
  {
    q: 'What is Hubnovo?',
    a: 'One app for community, learning, marketplace and jobs, with one free account.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. Creating an account is free.',
  },
  {
    q: 'Can I sell my products or services?',
    a: 'Yes. Open a storefront in the Marketplace or list your skills in Artisans & Pros.',
  },
  {
    q: 'How do I post or apply for a job?',
    a: 'Go to Jobs & Careers. Job seekers apply in a few taps. Employers post for free.',
  },
  {
    q: 'When will savings, ajo and loans be available?',
    a: 'They are in development. Create an account and you will be notified.',
  },
  {
    q: 'Who do I contact for help?',
    a: 'Email hello@hubnovo.com.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-white py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">FAQs</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Can&apos;t find what you need?{' '}
            <a href="mailto:hello@hubnovo.com" className="font-semibold text-brand hover:text-brand-deep">
              Email our team
            </a>
            .
          </p>
        </div>

        <div className="border-t border-line">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg font-semibold text-ink">{q}</span>
                <Plus className="h-5 w-5 shrink-0 text-ink transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="-mt-1 pb-6 pr-10 text-[15px] leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
