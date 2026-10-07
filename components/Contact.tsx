import Link from 'next/link'
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react'

const contacts = [
  { icon: Mail, label: 'Email', value: 'hello@hubnovo.com', href: 'mailto:hello@hubnovo.com' },
  { icon: Phone, label: 'Phone', value: '+234 (0) 901 234 5678', href: 'tel:+2349012345678' },
  { icon: MapPin, label: 'Office', value: 'Lagos, Nigeria' },
]

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA band */}
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/15" />
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/15" />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-5xl">
                Start saving with your people today.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/80">
                Create your free account in about two minutes.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-white/90"
              >
                Create free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="text-balance font-display text-3xl font-bold tracking-[-0.02em] text-ink">Talk to us</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Questions, partnerships or press. We&apos;d love to hear from you.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {contacts.map(({ icon: Icon, label, value, href }) => {
              const body = (
                <>
                  <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
                  <p className="mt-5 text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-[15px] font-semibold text-ink">{value}</p>
                </>
              )
              return href ? (
                <a key={label} href={href} className="bg-white p-6 transition-colors hover:bg-mist">
                  {body}
                </a>
              ) : (
                <div key={label} className="bg-white p-6">
                  {body}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
