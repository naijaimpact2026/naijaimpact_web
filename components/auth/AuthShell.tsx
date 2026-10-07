import Link from 'next/link'
import Image from 'next/image'
import { Check, KeyRound, MailCheck, Lock } from 'lucide-react'

// ── Shared auth styles ──────────────────────────────────────────────────────
// Fixed marketing tokens (ink/brand/line) rather than theme tokens, so auth
// pages stay light even when the OS is in dark mode.

export const authLabel = 'mb-1.5 block text-sm font-medium text-ink'

export const authInput =
  'h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-ink placeholder:text-slate-400 outline-none transition-[border-color,box-shadow] hover:border-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60'

export const authPrimaryButton =
  'flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60'

export const authFieldError = 'mt-1.5 text-sm text-red-600'

export const authLink = 'font-semibold text-brand hover:text-brand-deep'

export function AuthAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success'
  children: React.ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-sky-200 bg-sky-50 text-ink'
  return <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</div>
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

export function GoogleButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void
  loading: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-[15px] font-semibold text-ink transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.38-2.29V6.6H1.27a12 12 0 0 0 0 10.8l4.01-3.11Z" />
        <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.94 11.94 0 0 0 12 0 12 12 0 0 0 1.27 6.6l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
      </svg>
      {loading ? 'Connecting to Google…' : label}
    </button>
  )
}

// ── Right-hand brand panel ──────────────────────────────────────────────────

type PanelVariant = 'login' | 'signup' | 'secure'

function LoginPanel() {
  return (
    <>
      <h2 className="text-balance font-display text-4xl font-bold leading-[1.1] tracking-[-0.025em] xl:text-[44px]">
        Your circle is waiting for you.
      </h2>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
        Pick up where you left off: your savings goals, ajo contributions and conversations are
        all in one place.
      </p>
      {/* illustrative UI card, not live data */}
      <div className="mt-12 max-w-sm rounded-2xl bg-white p-5 text-ink shadow-2xl" aria-hidden="true">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Lekki Traders Circle</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">Active</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">7 of 10 members paid this cycle</p>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div className="h-full w-[70%] rounded-full bg-brand" />
        </div>
        <div className="mt-5 flex -space-x-1.5">
          {['AO', 'ZH', 'CO', 'EO', 'FA'].map((i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-ink text-[10px] font-bold text-white"
            >
              {i}
            </span>
          ))}
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600">
            +5
          </span>
        </div>
      </div>
    </>
  )
}

function SignupPanel() {
  const points = [
    'Free account, set up in about two minutes',
    'Save on your own or in an ajo circle',
    'Build your TradeCred score as you go',
    'Learn, chat and work with your community',
  ]
  return (
    <>
      <h2 className="text-balance font-display text-4xl font-bold leading-[1.1] tracking-[-0.025em] xl:text-[44px]">
        Save, borrow and grow with your people.
      </h2>
      <ul className="mt-10 space-y-5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-lg text-slate-200">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </>
  )
}

function SecurePanel() {
  const points = [
    { icon: MailCheck, text: 'Accounts are confirmed with a one-time code' },
    { icon: KeyRound, text: 'Every payment needs your transaction PIN' },
    { icon: Lock, text: 'All connections are encrypted' },
  ]
  return (
    <>
      <h2 className="text-balance font-display text-4xl font-bold leading-[1.1] tracking-[-0.025em] xl:text-[44px]">
        Security comes first.
      </h2>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
        A few extra seconds now keep your wallet, savings and community safe.
      </p>
      <ul className="mt-10 space-y-5">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-4 text-slate-200">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </>
  )
}

const panels: Record<PanelVariant, () => React.JSX.Element> = {
  login: LoginPanel,
  signup: SignupPanel,
  secure: SecurePanel,
}

// ── Shell ───────────────────────────────────────────────────────────────────

export default function AuthShell({
  children,
  panel,
  topRight,
}: {
  children: React.ReactNode
  panel: PanelVariant
  topRight?: React.ReactNode
}) {
  const Panel = panels[panel]
  return (
    <div className="flex min-h-screen bg-white text-ink [color-scheme:light]">
      {/* Form column */}
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2" aria-label="Hubnovo home">
            <Image src="/logo-mark.png" alt="" width={34} height={32} priority />
            <Image src="/logo-wordmark.png" alt="Hubnovo" width={90} height={30} priority />
          </Link>
          {topRight && <div className="text-sm text-slate-500">{topRight}</div>}
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:px-10">
          <span>© {new Date().getFullYear()} Hubnovo</span>
          <span className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-ink">Privacy</Link>
            <a href="mailto:hello@hubnovo.com" className="hover:text-ink">Help</a>
          </span>
        </footer>
      </div>

      {/* Brand panel */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-ink text-white lg:flex">
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-20 -right-20 h-[320px] w-[320px] rounded-full border border-white/[0.07]" />
        <div className="relative flex w-full flex-col justify-center px-14 py-16 xl:px-20">
          <Panel />
        </div>
      </aside>
    </div>
  )
}
