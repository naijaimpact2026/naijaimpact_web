const testimonials = [
  {
    name: 'Aisha Musa',
    role: 'Market trader, Kano',
    initials: 'AM',
    quote:
      'My ajo group switched from paper records to Hubnovo. No more arguments about who paid and who did not. Everything is on the app.',
  },
  {
    name: 'Adebayo Oluwaseun',
    role: 'Entrepreneur, Ibadan',
    initials: 'AO',
    quote:
      'My TradeCred score got me the microloan I needed to restock inventory. No bank would have approved me that fast.',
  },
  {
    name: 'Emeka Obi',
    role: 'Startup founder, Port Harcourt',
    initials: 'EO',
    quote:
      'I use NaijaSafe to lock away runway funds so I am not tempted to spend them. Locked savings with interest is exactly what I needed.',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 bg-mist py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Stories</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
            Built with the people who use it.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-line bg-white p-8">
              <blockquote className="flex-1 text-[17px] leading-relaxed text-ink">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{t.name}</span>
                  <span className="block text-sm text-slate-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
