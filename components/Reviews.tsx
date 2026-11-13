import Image from 'next/image'

// Quote first; a small avatar beside the name adds a human face without
// pulling attention away from the words. No stars or numbers.
const reviews = [
  {
    quote: 'Hubnovo brought our developer network under one roof.',
    name: 'Amina Bello',
    face: '/images/community/faces/innovator.jpg',
    role: 'Tech Community Host',
  },
  {
    quote: 'The verified badge gave clients immediate peace of mind.',
    name: 'Emeka Okafor',
    face: '/images/community/faces/artisan.jpg',
    role: 'Master Electrician',
  },
  {
    quote: 'Opening my digital storefront took less than five minutes.',
    name: 'Fatima Kabir',
    face: '/images/community/faces/tailor.jpg',
    role: 'Boutique Owner',
  },
  {
    quote: 'I landed my first remote design gig through the Job Board.',
    name: 'Tunde Adeleke',
    face: '/images/community/faces/career.jpg',
    role: 'UI/UX Designer',
  },
]

export default function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Reviews</p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
          What people are saying.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <figure key={r.name} className="flex flex-col justify-between rounded-2xl border border-line bg-mist/50 p-7">
              <blockquote className="font-display text-lg font-medium leading-snug text-ink">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <Image
                  src={r.face}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                />
                <div>
                  <p className="text-[15px] font-semibold text-ink">{r.name}</p>
                  <p className="text-sm text-ink-soft">{r.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
