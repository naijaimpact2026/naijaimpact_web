'use client'

import React from 'react'
import Link from 'next/link'
import
  {
    ArrowRight,
    MapPinned,
    Users,
    TrendingUp,
    Globe,
    MessageCircle,
    Wallet,
    ShieldCheck,
  } from 'lucide-react'

const stats = [
  { number: '50K+', label: 'Members', icon: Users },
  { number: '₦2B+', label: 'Transacted', icon: TrendingUp },
  { number: '36', label: 'States', icon: Globe },
]

const FEATURE_PILLS = [
  'Social Feed', 'Digital Wallet', 'Crowdfunding', 'Live Chat',
  'NaijaAjo', 'Micro-Loans', 'Learn & Earn', 'Insurance',
]

export default function Hero()
{
  return (
    <section className="relative overflow-hidden">
      {/* Soft, restrained backdrop — no neon glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EAF3FE 55%, #EFFBF5 100%)' }} />
      </div>

      <div className="container-gutter mx-auto max-w-7xl w-full pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* ── Left column ── */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 text-emerald text-sm font-semibold">
              <MapPinned className="w-4 h-4" />
              Built in Nigeria, for every Nigerian community
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.07] tracking-tight text-secondary">
                Connect. Save.
                <br />
                <span
                  style={{
                    backgroundImage: 'linear-gradient(120deg, #1569D6 0%, #00A86B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Grow Together.
                </span>
                <br />
                Build Nigeria.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Hubnovo brings your social life, finances, learning, and community savings into one
                trusted platform — built for every Nigerian, everywhere.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary/90 transition-colors text-sm"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-border text-secondary font-semibold rounded-xl hover:bg-muted transition-colors text-sm shadow-sm"
              >
                Sign In
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2.5">
                {[
                  { initials: 'CO', bg: '#1569D6' },
                  { initials: 'AO', bg: '#00A86B' },
                  { initials: 'ZH', bg: '#00B8D9' },
                  { initials: 'CN', bg: '#102A43' },
                  { initials: 'FA', bg: '#8BD450' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: p.bg }}
                  >
                    {p.initials}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-sm font-semibold text-secondary">50,000+</span>
                <span className="text-sm text-muted-foreground"> Nigerians already joined</span>
              </div>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-border">
              {stats.map((stat, i) =>
              {
                const Icon = stat.icon
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-secondary leading-none">{stat.number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right column — clean product preview, not a glossy AI mockup ── */}
          <div className="relative hidden lg:flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wallet Balance</p>
                  <p className="text-2xl font-bold text-secondary mt-0.5">₦124,850.00</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-end gap-1 h-16 mb-3">
                {[30, 55, 40, 72, 50, 85, 60, 95, 70, 100, 80, 110].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${h * 0.72}%` }} />
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">+18.4% this month</span>
                <span className="text-xs text-muted-foreground">via deposits &amp; Ajo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl bg-cyan/15 flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-cyan" />
                </div>
                <p className="text-lg font-bold text-secondary">Live Chat</p>
                <p className="text-xs text-muted-foreground mt-0.5">DMs &amp; group channels</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-primary font-medium">3 new messages</span>
                </div>
              </div>

              <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 100%)' }}>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-bold text-white">TradeCred</p>
                <p className="text-xs text-white/70 mt-0.5">Credit Score</p>
                <div className="mt-3 text-2xl font-black text-white">740 <span className="text-sm font-normal text-white/70">/ 1000</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Everything in one place</p>
              <div className="flex flex-wrap gap-2">
                {FEATURE_PILLS.map((label) => (
                  <span key={label} className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-muted text-secondary">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-6 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-secondary">Live across 36 states</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
