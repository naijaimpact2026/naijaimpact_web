'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    color: 'text-amber-600',
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

export default function About() {
  return (
    <section id="about" className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gray-50 -z-10 rounded-r-[80px] hidden lg:block" />

      <div className="container-gutter mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — visual stack */}
          <div className="relative space-y-4">
            <div className="rounded-2xl border border-border bg-white shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                {/* Light Mode Logo */}
                <Image src="/logo.png" alt="Hubnovo" width={44} height={44} className="rounded-xl dark:hidden" />
                {/* Dark Mode Logo */}
                <Image src="/logo-darkmode (1).png" alt="Hubnovo" width={44} height={44} className="rounded-xl hidden dark:block" />
                <div>
                  <div className="font-bold text-secondary">Hubnovo</div>
                  <div className="text-xs text-muted-foreground">Est. 2020 · Lagos, Nigeria</div>
                </div>
              </div>
              <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-gray-700">{m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5 text-center">
              <div className="text-3xl font-bold text-secondary">2020</div>
              <div className="text-sm text-muted-foreground mt-1">Year Founded</div>
            </div>
            <div className="rounded-2xl p-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #0A1E33 0%, #102A43 100%)' }}>
              <div className="text-3xl font-bold text-white">36</div>
              <div className="text-sm text-white/70 mt-1">States Reached</div>
            </div>
          </div>

          <div className="absolute -bottom-4 -right-4 bg-white px-4 py-3 rounded-2xl shadow-lg border border-border hidden md:block">
            <div className="text-xs text-muted-foreground mb-1">Community Rating</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-4 h-4 rounded-sm bg-amber-400" />
              ))}
              <span className="text-sm font-bold text-secondary ml-1">5.0</span>
            </div>
          </div>
        </div>

        {/* Right — content */}
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              Our Story
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-secondary leading-tight">
              Built for{' '}
              <span
                style={{
                  backgroundImage: 'linear-gradient(120deg, #1569D6 0%, #00A86B 100%)',
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
            <p className="text-muted-foreground leading-relaxed">
              We started with a simple question: why should a market trader in Kano and a software
              engineer in Lagos have to use different apps to manage their community, savings, and
              social life?
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Hubnovo was born to change that — one all-in-one platform that respects how
              Nigerians actually live, save, and support each other.
            </p>
          </div>

          <div className="space-y-2">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl ${value.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${value.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary text-sm mb-0.5">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-colors duration-200"
          >
            Join the community
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
    </section >
  )
}
