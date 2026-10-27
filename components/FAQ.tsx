import { Plus } from 'lucide-react'

const faqs = [
  {
    q: 'What is Hubnovo?',
    a: 'Hubnovo is one app for your community, learning, marketplace and job search. Post and chat with people, take or teach courses, open a storefront, hire artisans and pros, and find work, all from one free account.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. Creating a Hubnovo account is free, and you can use the community, Learn, Marketplace and Jobs from your free account.',
  },
  {
    q: 'Can I sell my products or services on Hubnovo?',
    a: 'Yes. Open a storefront in the Marketplace to list products, or list your skills in Artisans & Pros so people near you can hire you. Marketplace payments are processed securely by Paystack.',
  },
  {
    q: 'How do I post a job or apply for one?',
    a: 'Go to Jobs & Careers. Job seekers can browse roles and apply in a few taps, then track every application. Employers can post a job for free and review applicants in the app.',
  },
  {
    q: 'When are savings, ajo and loans coming?',
    a: "We're building savings, ajo circles, credit and crowdfunding now. They aren't available yet. Create your account and we'll let you know as each one opens.",
  },
  {
    q: 'I need help with my account. Who do I contact?',
    a: 'Email us at hello@hubnovo.com and the team will get back to you.',
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
