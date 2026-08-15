'use client'

import React from 'react'
import Link from 'next/link'
import
  {
    ArrowRight,
    Sparkles,
    Users,
    TrendingUp,
    Globe,
    MessageCircle,
    Wallet,
    BookOpen,
    Shield,
  } from 'lucide-react'

const stats = [
  { number: '50K+', label: 'Members', icon: Users },
  { number: '₦2B+', label: 'Transacted', icon: TrendingUp },
  { number: '36', label: 'States', icon: Globe },
]

// Mini floating feature pills shown in the hero visual
const featurePills = [
  { label: 'Social Feed', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { label: 'Digital Wallet', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { label: 'Crowdfunding', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  { label: 'Live Chat', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { label: 'NaijaAjo', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { label: 'Micro-Loans', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { label: 'Learn & Earn', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { label: 'Insurance', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
]

export default function Hero()
{
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20" />
        <div
          className="absolute top-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full opacity-25 dark:opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(166,76%,40%) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(199,100%,43%) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(hsl(166,76%,40%) 1px, transparent 1px), linear-gradient(90deg, hsl(166,76%,40%) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="container-gutter mx-auto max-w-7xl w-full pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* ── Left column ── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              The All-in-One Nigerian Community Platform
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.07] tracking-tight">
                <span className="text-gray-900 dark:text-white">Connect. Save.</span>
                <br />
                <span
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%), hsl(166,76%,55%))',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'gradient-shift 4s ease infinite',
                  }}
                >
                  Grow Together.
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">Build Nigeria.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                NaijaImpact brings your social life, finances, learning, and community savings into one
                beautiful platform — built for every Nigerian, everywhere.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 text-sm"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 text-sm shadow-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2.5">
                {['CO', 'AO', 'ZH', 'CN', 'FA'].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{
                      background: `hsl(${[166, 199, 30, 280, 45][i]}, 76%, ${[45, 43, 55, 50, 48][i]}%)`,
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">50,000+</span>
                <span className="text-sm text-gray-500 dark:text-gray-400"> Nigerians already joined</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4 border-t border-gray-100 dark:border-slate-800">
              {stats.map((stat, i) =>
              {
                const Icon = stat.icon
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                        {stat.number}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right column — visual bento ── */}
          <div className="relative hidden lg:flex flex-col gap-4">
            {/* Main dashboard preview card */}
            <div className="bento-card noise-bg p-6 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wallet Balance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                    ₦124,850.00
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* Sparkline */}
              <div className="flex items-end gap-1 h-16 mb-3">
                {[30, 55, 40, 72, 50, 85, 60, 95, 70, 100, 80, 110].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-secondary opacity-75"
                    style={{ height: `${h * 0.72}%` }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +18.4% this month
                </span>
                <span className="text-xs text-gray-400">via deposits & Ajo</span>
              </div>
            </div>

            {/* Two small cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bento-card noise-bg p-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Live Chat</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">DMs & group channels</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-500 font-medium">3 new messages</span>
                </div>
              </div>

              <div className="bento-card noise-bg p-5 bg-gradient-to-br from-primary to-secondary">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-bold text-white">TradeCred</p>
                <p className="text-xs text-white/70 mt-0.5">Credit Score</p>
                <div className="mt-3 text-2xl font-black text-white">740 <span className="text-sm font-normal text-white/70">/ 1000</span></div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="bento-card noise-bg p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Everything in one place
              </p>
              <div className="flex flex-wrap gap-2">
                {featurePills.map((pill, i) => (
                  <span
                    key={i}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${pill.color}`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-6 glass-effect px-4 py-2.5 rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Live across 36 states
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
