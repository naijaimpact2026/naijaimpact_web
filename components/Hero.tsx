'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  MapPinned,
  Users,
  TrendingUp,
  Globe,
  MessageCircle,
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

const stats = [
  { number: '50K+', label: 'Members', icon: Users },
  { number: '₦2B+', label: 'Transacted', icon: TrendingUp },
  { number: '36', label: 'States', icon: Globe },
]

const FEATURE_PILLS = [
  'Social Feed',
  'Digital Wallet',
  'Crowdfunding',
  'Live Chat',
  'NaijaAjo',
  'Micro-Loans',
  'Learn & Earn',
  'Insurance',
]

const avatars = [
  { initials: 'CO', bg: '#1569D6' },
  { initials: 'AO', bg: '#00A86B' },
  { initials: 'ZH', bg: '#00B8D9' },
  { initials: 'CN', bg: '#102A43' },
  { initials: 'FA', bg: '#8BD450' },
]

const chartBars = [30, 55, 40, 72, 50, 85, 60, 95, 70, 100, 80, 110]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F7FAFC]">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #F8FBFF 0%, #EDF5FD 50%, #F2FBF7 100%)',
          }}
        />

        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="container-gutter mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-80px)] items-center gap-14 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-24">

          {/* ========================================================= */}
          {/* LEFT */}
          {/* ========================================================= */}

          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-[#2676C9] shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              Built in Nigeria, for Nigerians
            </div>

            {/* Heading */}
            <h1 className="font-display text-[3.4rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-[#173F63] sm:text-6xl lg:text-[5.1rem]">
              Connect.
              <br />

              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(110deg, #1569D6 0%, #2788C9 45%, #43A878 100%)',
                }}
              >
                Save.
              </span>{' '}
              <span>Grow.</span>

              <br />

              <span className="text-[#173F63]">Build Nigeria.</span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-xl text-base leading-7 text-[#7890AB] sm:text-lg sm:leading-8">
              One trusted platform for your social life, finances, learning,
              and community savings. Designed around how Nigerians live,
              connect, and grow.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#173F63] px-7 text-sm font-semibold text-white shadow-lg shadow-[#173F63]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#102F4B] hover:shadow-xl"
              >
                Get Started Free

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/auth/login"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-[#D8E2EC] bg-white/90 px-7 text-sm font-semibold text-[#173F63] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                Sign In
              </Link>
            </div>

            {/* Members */}
            <div className="mt-9 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-[#F4F8FC] text-[9px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: avatar.bg }}
                  >
                    {avatar.initials}
                  </div>
                ))}
              </div>

              <div className="text-sm">
                <span className="font-bold text-[#173F63]">
                  50,000+
                </span>{' '}
                <span className="text-[#8BA0B7]">
                  Nigerians already joined
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-9 border-t border-[#D7E1EB] pt-6">
              <div className="grid grid-cols-3 gap-5">
                {stats.map((stat, index) => {
                  const Icon = stat.icon

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F2FF]">
                        <Icon className="h-4 w-4 text-[#2676C9]" />
                      </div>

                      <div>
                        <div className="text-lg font-bold leading-none text-[#173F63] sm:text-xl">
                          {stat.number}
                        </div>

                        <div className="mt-1 text-[11px] text-[#8BA0B7] sm:text-xs">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PRODUCT PREVIEW */}
          {/* ========================================================= */}

          <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto">

            {/* Floating live badge */}
            <div className="absolute -right-2 -top-4 z-20 hidden rounded-2xl border border-[#D8E2EC] bg-white px-4 py-3 shadow-lg sm:block lg:-right-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#91A3B7]">
                    Community
                  </p>

                  <p className="text-xs font-bold text-[#173F63]">
                    Live across 36 states
                  </p>
                </div>
              </div>
            </div>

            {/* Main product dashboard */}
            <div className="relative overflow-hidden rounded-[28px] border border-[#D5E0EA] bg-white p-5 shadow-[0_25px_70px_rgba(23,63,99,0.12)] sm:p-7">

              {/* Top bar */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF]">
                    <Wallet className="h-5 w-5 text-[#2676C9]" />
                  </div>

                  <div>
                    <p className="text-xs text-[#91A3B7]">
                      Your Hubnovo Wallet
                    </p>

                    <p className="text-sm font-bold text-[#173F63]">
                      Financial Overview
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3EAF1] bg-white text-[#8EA0B2] transition hover:bg-[#F5F8FB]"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              {/* Balance */}
              <div className="rounded-2xl bg-gradient-to-br from-[#173F63] to-[#245A87] p-5 text-white shadow-lg shadow-[#173F63]/10 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">
                      Available balance
                    </p>

                    <p className="mt-2 flex items-baseline text-3xl font-extrabold tracking-tight sm:text-4xl">
                      <span>₦124,850</span>
                      <span className="ml-0.5 text-lg font-bold text-white/60">.00</span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-2.5">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Chart */}
                <div className="mt-7 flex h-24 items-end gap-1.5 sm:h-28">
                  {chartBars.map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-white/25 transition-all hover:bg-white/50"
                      style={{
                        height: `${Math.min(height * 0.75, 100)}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                      +18.4%
                    </span>

                    <span className="text-[11px] text-white/50">
                      this month
                    </span>
                  </div>

                  <span className="text-[11px] text-white/50">
                    Deposits & Ajo
                  </span>
                </div>
              </div>

              {/* Product cards */}
              <div className="mt-4 grid grid-cols-2 gap-4">

                {/* Chat */}
                <div className="rounded-2xl border border-[#E0E8F0] bg-[#FBFDFF] p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F8FC]">
                      <MessageCircle className="h-5 w-5 text-[#28A9C7]" />
                    </div>

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>

                  <p className="mt-4 text-base font-bold text-[#173F63]">
                    Live Chat
                  </p>

                  <p className="mt-1 text-[11px] text-[#8CA0B5]">
                    DMs & group channels
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#2676C9]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2676C9]" />
                    3 new messages
                  </div>
                </div>

                {/* TradeCred */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0F2942] p-4 text-white sm:p-5">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5" />

                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>

                    <p className="mt-4 text-base font-bold">
                      TradeCred
                    </p>

                    <p className="mt-1 text-[11px] text-white/50">
                      Credit Score
                    </p>

                    <div className="mt-3">
                      <span className="text-2xl font-extrabold">
                        740
                      </span>

                      <span className="ml-1 text-xs text-white/50">
                        / 1000
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Everything */}
              <div className="mt-4 rounded-2xl border border-[#E0E8F0] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2676C9]" />

                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#91A3B7]">
                    Everything in one place
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {FEATURE_PILLS.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-[#E1E8EF] bg-[#F7FAFC] px-3 py-1.5 text-[10px] font-semibold text-[#45617C] transition hover:border-[#BBD3E8] hover:bg-[#EEF6FF]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom floating stat */}
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#D9E4ED] bg-white p-3 shadow-xl sm:block lg:-left-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>

                <div>
                  <p className="text-[10px] text-[#91A3B7]">
                    Monthly growth
                  </p>

                  <p className="text-sm font-bold text-[#173F63]">
                    +18.4%
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}