import { Plus } from 'lucide-react'

const faqs = [
  {
    q: 'What is Hubnovo?',
    a: 'Hubnovo is one app for your savings, ajo circles, credit score, micro-loans and insurance, plus a community where you can post, chat, learn and offer your services.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. Creating a Hubnovo account is free, and every product is available from your free account.',
  },
  {
    q: 'How does NaijaAjo work?',
    a: 'You start or join a circle of 2 to 20 members and agree on an amount and a schedule (weekly, bi-weekly or monthly). Everyone contributes each cycle, and one member receives the payout in turn. Every contribution is recorded, so there are no arguments about who has paid.',
  },
  {
    q: 'How is my TradeCred score calculated?',
    a: 'Your score runs from 0 to 1000 and reflects your activity on Hubnovo, including your savings, transactions and ajo history. You can see a breakdown by category and tips to improve it.',
  },
  {
    q: 'How do I add money to my wallet?',
    a: 'Fund your wallet securely through Paystack from the Wallet page. Your balance updates once the payment is confirmed.',
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
