'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, Target, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react'

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'Every decision starts with one question: does this help Nigerian communities?',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Target,
    title: 'Measurable Impact',
    description: 'We track real outcomes — transactions, campaigns funded, courses completed.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Lightbulb,
    title: 'Accessible Innovation',
    description: 'Cutting-edge technology that works on any phone, any connection speed.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

const milestones = [
  'Founded in Lagos, 2020',
  'Reached 10,000 members in year one',
  'Expanded to all 36 Nigerian states',
  'Launched NaijaAjo digital cooperative savings',
  'Integrated TradeCred alternative credit scoring',
  '50,000+ active members today',
]

export default function About()
{
  return (
    <section id="about" className="relative py-24 md:py-36 overflow-hidden">
      {/* Decorative half-background */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gray-50 dark:bg-slate-900/40 -z-10 rounded-r-[80px] hidden lg:block" />

      <div className="container-gutter mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — visual stack */}
          <div className="relative space-y-4">
            {/* Main milestones card */}
            <div className="bento-card noise-bg p-8 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                  N
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">HubNovo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Est. 2020 · Lagos, Nigeria</div>
                </div>
              </div>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bento-card noise-bg p-5 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">2020</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Year Founded</div>
              </div>
              <div className="bento-card noise-bg p-5 text-center bg-gradient-to-br from-primary to-secondary">
                <div className="text-3xl font-bold text-white">36</div>
                <div className="text-sm text-white/70 mt-1">States Reached</div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 glass-effect px-4 py-3 rounded-2xl shadow-xl hidden md:block">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Community Rating</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-4 h-4 rounded-sm bg-amber-400" />
                ))}
                <span className="text-sm font-bold text-gray-900 dark:text-white ml-1">5.0</span>
              </div>
            </div>
          </div>

          {/* Right — content */}
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                Our Story
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Built for{' '}
                <span
                  style={{
                    backgroundImage: 'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Nigeria,
                </span>
                <br />
                by Nigerians
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                We started with a simple question: why should a market trader in Kano and a software
                engineer in Lagos have to use different apps to manage their community, savings, and
                social life?
              </p>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              HubNovo was born to change that — one all-in-one platform that respects how
                Nigerians actually live, save, and support each other.
              </p>
            </div>

            {/* Values */}
            <div className="space-y-2">
              {values.map((value, index) =>
              {
                const Icon = value.icon
                return (
                  <div
                    key={index}
                    className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-default"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${value.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 ${value.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                        {value.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{value.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
            >
              Join the community
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
