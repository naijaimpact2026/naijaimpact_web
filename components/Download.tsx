import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

// Fill these in when the store listings go live. A badge with no URL shows
// as "Coming soon" instead of linking anywhere.
const STORE_LINKS = {
  appStore: '',
  googlePlay: '',
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.83c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.67 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M3.6 2.2c-.23.25-.36.63-.36 1.12v17.36c0 .49.13.87.36 1.12l.06.06L13.4 12.1v-.2L3.66 2.14l-.06.06zM16.65 15.35 13.4 12.1v-.2l3.25-3.25.07.04 3.85 2.19c1.1.62 1.1 1.64 0 2.27l-3.85 2.18-.07.02zM16.72 15.31 13.4 12 3.6 21.8c.36.38.96.43 1.64.05l11.48-6.54M16.72 8.69 5.24 2.15C4.56 1.77 3.96 1.82 3.6 2.2L13.4 12l3.32-3.31z" />
    </svg>
  )
}

function StoreBadge({ href, label, store, icon }: { href: string; label: string; store: string; icon: ReactNode }) {
  const body = (
    <>
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[11px] text-white/70">{href ? label : 'Coming soon to'}</span>
        <span className="block text-base font-semibold">{store}</span>
      </span>
    </>
  )
  const cls = 'inline-flex h-14 min-w-[180px] items-center gap-3 rounded-xl bg-ink px-5 text-white'
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-colors hover:bg-ink/90`}>
      {body}
    </a>
  ) : (
    <span className={`${cls} cursor-default opacity-60`} aria-disabled="true">
      {body}
    </span>
  )
}

export default function Download() {
  return (
    <section id="download" className="scroll-mt-20 bg-white pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/15" />
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/15" />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-5xl">
                Get Hubnovo today.
              </h2>
              <Link
                href="/auth/signup"
                className="group mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-white hover:text-white/80"
              >
                Or create a free account on the web
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <StoreBadge href={STORE_LINKS.appStore} label="Download on the" store="App Store" icon={<AppleLogo />} />
              <StoreBadge href={STORE_LINKS.googlePlay} label="Get it on" store="Google Play" icon={<PlayLogo />} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
