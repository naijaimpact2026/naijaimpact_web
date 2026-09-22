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
      'Share posts, images, and videos. Follow people you admire. React, comment, and mention — a full social experience built for Nigerian communities.',
    tint: 'bg-primary/10 text-primary',
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
      'Deposit, send, and withdraw money. Pay with PIN. View your full transaction history — fast, secure, and always available.',
    tint: 'bg-emerald/10 text-emerald',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: TrendingUp,
    title: 'Crowdfunding',
    description:
      'Launch campaigns and community projects. Accept donations from across Nigeria. Track your goal in real time with live progress bars.',
    tint: 'bg-cyan/10 text-cyan',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description:
      'Direct messages and group channels. Send images, videos, and files. Create team spaces for your community or business.',
    tint: 'bg-secondary/10 text-secondary',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: BookOpen,
    title: 'Learn & Earn',
    description:
      'Enrol in free or paid courses. Creators publish video lessons and earn directly. Track progress and earn completion badges.',
    tint: 'bg-amber-500/10 text-amber-600',
    span: 'lg:col-span-2',
    extras: null,
  },
  {
    icon: Briefcase,
    title: 'Services Marketplace',
    description:
      'List your skills, set pricing tiers, and connect with clients. Contact any provider directly via chat — Nigeria\'s freelance hub, built in.',
    tint: 'bg-rose-500/10 text-rose-600',
    span: 'lg:col-span-1',
    extras: null,
  },
  {
    icon: Search,
    title: 'Unified Search',
    description:
      'Find people, posts, and courses from one search bar with instant results. Tap any result and land directly on the right page.',
    tint: 'bg-purple-500/10 text-purple-600',
    span: 'lg:col-span-2',
    extras: null,
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Real-time alerts for follows, reactions, comments, and mentions. Live badge counts on every device. Never miss what matters.',
    tint: 'bg-primary/10 text-primary',
    span: 'lg:col-span-2',
    extras: null,
  },
]

export default function Features()
{
  return (
    <section id="features" className="relative scroll-mt-24 py-24 md:py-32 bg-background">
      <div className="container-gutter mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              Platform Features
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-secondary">
              One app.
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(120deg, #1569D6 0%, #00A86B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Endless impact.
              </span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-base leading-relaxed md:text-right">
            Eight powerful features, seamlessly connected social, financial, educational, and
            professional tools in a single platform built for Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) =>
          {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-7 ${feature.span}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${feature.tint}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-secondary mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {feature.extras && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {feature.extras.map((extra, i) =>
                    {
                      const ExtraIcon = extra.icon
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                        >
                          <ExtraIcon className="w-3 h-3" />
                          {extra.label}
                        </span>
                      )
                    })}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  <span>Explore feature</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary/90 transition-colors text-sm"
          >
            Get access to all features
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
