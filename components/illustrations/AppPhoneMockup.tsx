import { ArrowDownLeft, ArrowUpRight, Plus, Users, Send, Landmark, Bell } from 'lucide-react'

// Static, illustrative render of the Hubnovo app home screen for marketing
// pages. All figures are sample UI content, not live data.

const activity = [
  { label: 'Ajo contribution', meta: 'Lekki Traders Circle', amount: '-₦20,000', icon: ArrowUpRight },
  { label: 'Wallet top-up', meta: 'Via Paystack', amount: '+₦50,000', icon: ArrowDownLeft },
  { label: 'Rent goal', meta: 'NaijaSafe', amount: '-₦15,000', icon: ArrowUpRight },
]

const actions = [
  { label: 'Add', icon: Plus },
  { label: 'Send', icon: Send },
  { label: 'Ajo', icon: Users },
  { label: 'Loans', icon: Landmark },
]

export default function AppPhoneMockup({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-[300px] rounded-[44px] bg-ink p-[10px] shadow-[0_40px_80px_-20px_rgba(11,27,46,0.35)] ${className}`}
      aria-hidden="true"
    >
      <div className="relative overflow-hidden rounded-[34px] bg-[#F6F8FB]">
        {/* status bar */}
        <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold text-ink">
          <span>9:41</span>
          <span className="h-[18px] w-[72px] rounded-full bg-ink" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-sm bg-ink" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          </span>
        </div>

        <div className="space-y-3 px-4 pb-5 pt-3">
          {/* greeting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
                CO
              </span>
              <div className="leading-tight">
                <p className="text-[10px] text-slate-500">Good morning</p>
                <p className="text-[12px] font-semibold text-ink">Chioma</p>
              </div>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
              <Bell className="h-3.5 w-3.5 text-ink" />
            </span>
          </div>

          {/* balance */}
          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="text-[10px] font-medium text-white/60">Total balance</p>
            <p className="mt-1 font-display text-[26px] font-bold tracking-tight">
              ₦482,300<span className="text-[15px] text-white/50">.00</span>
            </p>
            <div className="mt-3 flex gap-4 text-[10px]">
              <div>
                <p className="text-white/50">Wallet</p>
                <p className="font-semibold">₦96,800</p>
              </div>
              <div>
                <p className="text-white/50">Savings</p>
                <p className="font-semibold">₦385,500</p>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="grid grid-cols-4 gap-2">
            {actions.map(({ label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="h-4 w-4 text-brand" />
                </span>
                <span className="text-[9px] font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* ajo progress */}
          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-ink">Lekki Traders Circle</p>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-semibold text-brand">
                Your turn: Mar
              </span>
            </div>
            <p className="mt-0.5 text-[9px] text-slate-500">7 of 10 members paid this cycle</p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100">
              <div className="h-full w-[70%] rounded-full bg-brand" />
            </div>
          </div>

          {/* activity */}
          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <p className="mb-2 text-[11px] font-semibold text-ink">Recent activity</p>
            <div className="space-y-2.5">
              {activity.map(({ label, meta, amount, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mist">
                    <Icon className="h-3.5 w-3.5 text-ink" />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[10px] font-semibold text-ink">{label}</p>
                    <p className="text-[9px] text-slate-500">{meta}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-ink">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
