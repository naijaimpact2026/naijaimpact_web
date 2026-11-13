import Image from 'next/image'
import {
  Home,
  Compass,
  Users,
  ShoppingBag,
  Briefcase,
  Wrench,
  Rocket,
  BookOpen,
  MessageCircle,
  Bell,
  Wallet,
  HandCoins,
  Search,
  ArrowRight,
  PlayCircle,
} from 'lucide-react'

// A desktop view of the Hubnovo dashboard (/app) inside a browser window.
// Built in code, mirroring the real app's sidebar, welcome card and quick
// actions, so it stays sharp at any size. Decorative: the whole thing is one
// labelled image for screen readers.

const NAV = [
  { icon: Home, label: 'Home', active: true },
  { icon: Compass, label: 'Explore' },
  { icon: Users, label: 'Community' },
  { icon: ShoppingBag, label: 'Marketplace' },
  { icon: Briefcase, label: 'Jobs & Careers' },
  { icon: Wrench, label: 'Artisans & Pros' },
  { icon: Rocket, label: 'Business LaunchPad' },
  { icon: BookOpen, label: 'Learn' },
  { icon: MessageCircle, label: 'Chat', badge: '1' },
  { icon: Bell, label: 'Notifications', badge: '3' },
  { icon: Wallet, label: 'Wallet' },
]

const QUICK = [
  { icon: BookOpen, label: 'Learn', tint: 'bg-blue-50 text-blue-600' },
  { icon: Briefcase, label: 'Jobs', tint: 'bg-cyan-50 text-cyan-600' },
  { icon: ShoppingBag, label: 'Marketplace', tint: 'bg-amber-50 text-amber-600' },
  { icon: Rocket, label: 'LaunchPad', tint: 'bg-slate-100 text-slate-700' },
  { icon: Wallet, label: 'Wallet', tint: 'bg-emerald-50 text-emerald-600' },
  { icon: Users, label: 'Community', tint: 'bg-cyan-50 text-cyan-600' },
  { icon: Wrench, label: 'Artisans', tint: 'bg-rose-50 text-rose-600' },
  { icon: HandCoins, label: 'Crowdfunding', tint: 'bg-slate-100 text-slate-700' },
]

const TODAY = [
  { icon: BookOpen, title: 'Learn a Skill', sub: 'Free and premium courses', tint: 'bg-blue-50 text-blue-600' },
  { icon: Briefcase, title: 'Find a Job', sub: 'Thousands of opportunities', tint: 'bg-cyan-50 text-cyan-600' },
  { icon: ShoppingBag, title: 'Shop Products', sub: 'Buy from trusted sellers', tint: 'bg-amber-50 text-amber-600' },
]

export default function DashboardFrame({ className = '' }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="The Hubnovo dashboard on desktop, with the sidebar, a welcome card and quick links to Learn, Jobs, Marketplace and Wallet"
      className={`w-[760px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_80px_-20px_rgba(11,27,46,0.35)] ${className}`}
    >
      {/* Browser chrome */}
      <div aria-hidden className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto w-64 rounded-md bg-white px-3 py-1 text-center text-[10px] text-slate-500 ring-1 ring-slate-200">
          hubnovo.com/app
        </div>
        <div className="w-10" />
      </div>

      <div aria-hidden className="flex h-[470px] text-ink">
        {/* Sidebar */}
        <aside className="w-[168px] shrink-0 border-r border-slate-100 bg-white px-3 py-4">
          <div className="mb-4 flex items-center gap-2 px-2">
            <Image src="/logo-mark.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
            <span className="font-display text-[13px] font-bold">Hubnovo</span>
          </div>
          <ul className="space-y-0.5">
            {NAV.map(({ icon: Icon, label, active, badge }) => (
              <li
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-[6px] text-[11px] font-medium ${
                  active ? 'bg-brand/10 text-brand' : 'text-slate-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{label}</span>
                {badge && (
                  <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[9px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50/70">
          {/* Top bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-2.5">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
              <Search className="h-3.5 w-3.5" />
              Search people, courses, jobs…
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-brand">
              AP
            </span>
          </div>

          <div className="space-y-4 p-5">
            {/* Welcome */}
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5">
              <p className="font-display text-lg font-bold">Welcome to Hubnovo, Agba</p>
              <p className="mt-0.5 text-[11px] font-semibold text-brand">People. Opportunities. Prosperity.</p>
              <p className="mt-2 text-[11px] text-slate-500">Learn. Earn. Save. Start. Connect. Make an impact.</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[10px] font-semibold text-white">
                  Explore Opportunities <ArrowRight className="h-3 w-3" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-[10px] font-semibold">
                  <PlayCircle className="h-3 w-3" /> Watch Video
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-8 gap-2">
              {QUICK.map(({ icon: Icon, label, tint }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-[9px] font-medium leading-tight text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            {/* Today */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-[13px] font-bold">What would you like to do today?</p>
                <span className="text-[10px] font-semibold text-brand">View All</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TODAY.map(({ icon: Icon, title, sub, tint }) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tint}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-[11px] font-bold">{title}</p>
                    <p className="text-[9px] text-slate-500">{sub}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-brand">
                      Get Started <ArrowRight className="h-2.5 w-2.5" />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
