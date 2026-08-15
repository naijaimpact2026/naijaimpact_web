'use client'

import React from 'react'
import Link from 'next/link'
import
  {
    Users,
    MessageCircle,
    Wallet,
    TrendingUp,
    BookOpen,
    Briefcase,
    Bell,
    Search,
    ArrowUpRight,
    Heart,
    Image as ImageIcon,
    Video,
  } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Social Feed',
    description:
      'Share posts, images, and videos. Follow people you admire. React, comment, and mention — a full Instagram-style social experience tailored for Nigerian communities.',
    gradient: 'from-violet-500 to-purple-500',
    span: 'lg:col-span-2',
    extras: [
      { icon: Heart, label: 'Reactions' },
      { icon: ImageIcon, label: 'Photo posts' },
      { icon: Video, label: 'Video posts' },
    ],
  },
  {
    icon: Wallet,
    title: 'Digital Wallet',
    description:
      'Deposit, send, and withdraw money. Pay with PIN. View your full transaction history. Powered by Paystack — fast, secure, and always available.',
    gradient: 'from-emerald-500 to-teal-400',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: TrendingUp,
    title: 'Crowdfunding',
    description:
      'Launch campaigns and community projects. Accept donations from across Nigeria. Track your goal in real time with live progress bars.',
    gradient: 'from-blue-500 to-cyan-400',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description:
      'Direct messages and group channels powered by Stream Chat. Send images, videos, and files. Create team spaces for your community or business.',
    gradient: 'from-cyan-500 to-blue-400',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: BookOpen,
    title: 'Learn & Earn',
    description:
      'Enrol in free or paid courses. Creators publish video lessons and earn directly. Track progress and earn completion badges — education that pays.',
    gradient: 'from-amber-400 to-orange-500',
    span: 'lg:col-span-2',
    extras: null,
  },
  {
    icon: Briefcase,
    title: 'Services Marketplace',
    description:
      'List your skills, set pricing tiers, and connect with clients. Contact any provider directly via chat. Nigeria\'s freelance hub, built in.',
    gradient: 'from-rose-500 to-pink-500',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: Search,
    title: 'Unified Search',
    description:
      'Find users, posts, and courses from one search bar with instant results. Tap any result and land directly on the right page.',
    gradient: 'from-slate-500 to-slate-600',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Real-time alerts for follows, reactions, comments, and mentions. Live badge counts on every device. Never miss what matters.',
    gradient: 'from-indigo-500 to-violet-500',
    span: 'lg:col-span-1',
    extras: null,
  },
]

export default function Features()
{
  return (
    <section id="features" className="relative py-24 md:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gray-50/90 dark:bg-slate-950/60" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] opacity-10 dark:opacity-5"
          style={{
            background: 'radial-gradient(ellipse, hsl(166,76%,40%) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="container-gutter mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">One app.</span>
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Endless impact.
              </span>
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm text-base leading-relaxed md:text-right">
            Eight powerful features, seamlessly connected — social, financial, educational, and
            professional tools in a single platform built for Nigeria.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) =>
          {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group bento-card noise-bg p-7 ${feature.span}`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Extra pills for wide cards */}
                {feature.extras && (
                  <div className="flex gap-2 mt-4">
                    {feature.extras.map((extra, i) =>
                    {
                      const ExtraIcon = extra.icon
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                        >
                          <ExtraIcon className="w-3 h-3" />
                          {extra.label}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Learn more arrow */}
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">
                  <span>Explore feature</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>

                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`}
                />
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 text-sm"
          >
            Get access to all features
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
