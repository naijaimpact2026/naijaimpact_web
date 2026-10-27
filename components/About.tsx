import Image from 'next/image'
import { Sparkles, Users, Award, ShieldCheck } from 'lucide-react'

const values = [
  {
    icon: Users,
    title: 'Community first',
    description: 'Every decision starts with one question: does this genuinely empower Nigerian communities?',
  },
  {
    icon: Award,
    title: 'Measurable impact',
    description: 'We track real outcomes: verified funds saved, local ventures funded, courses completed.',
  },
  {
    icon: ShieldCheck,
    title: 'Works for everyone',
    description: 'Engineered to run seamlessly on any smartphone and any network speed across all 36 states.',
  },
]

const stats = [
  { number: '50K+', label: 'Active members', detail: 'Growing daily' },
  { number: '₦2B+', label: 'Transacted safely', detail: '100% escrow backed' },
  { number: '36', label: 'States reached', detail: 'Across Nigeria' },
]

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white pb-20 pt-24 lg:pb-28 lg:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>About us</span>
            </div>
            <h2 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              Built in Nigeria, for Nigerians.
            </h2>
          </div>
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-ink-soft">
            <p>
              We started with a simple question: why should a market trader in Kano and a software
              engineer in Lagos need completely disconnected systems to manage their community, savings,
              and trade?
            </p>
            <p>
              Hubnovo is our answer. One unified platform that respects and elevates how Nigerians actually live,
              save, learn, and lift each other up.
            </p>
          </div>
        </div>

        {/* Authentic Nigerian Human Collaboration Photo Banner */}
        <div className="mt-14 relative h-72 sm:h-96 lg:h-[440px] rounded-3xl overflow-hidden border border-line shadow-lg group">
          <Image
            src="/images/people/nigerian-community-collaborating.jpg"
            alt="Nigerian entrepreneurs, students, and merchants collaborating together"
            fill
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/90 text-white text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-md">
                Lagos &bull; Kano &bull; Ibadan &bull; Port Harcourt
              </span>
              <p className="font-display text-lg sm:text-xl font-bold leading-tight">
                Where Nigerian trade traditions meet modern technology.
              </p>
            </div>
            <p className="text-xs text-white/80 font-medium">
              Real people. Real community. Real prosperity.
            </p>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-3 border-y border-line">
          {stats.map((s, i) => (
            <div key={s.label} className={`py-8 sm:py-10 ${i > 0 ? 'border-l border-line pl-5 sm:pl-10' : ''}`}>
              <dt className="text-xs sm:text-sm text-slate-500 font-medium">{s.label}</dt>
              <dd className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">
                {s.number}
              </dd>
              <p className="mt-1 text-[11px] sm:text-xs text-brand font-semibold">{s.detail}</p>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon
            return (
              <div key={v.title} className="p-6 rounded-2xl border border-line bg-mist/50">
                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{v.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

