'use client'

import React from 'react'
import Link from 'next/link'
import
    {
        Users,
        PiggyBank,
        BarChart3,
        CreditCard,
        Shield,
        ArrowRight,
        CheckCircle2,
    } from 'lucide-react'

const products = [
    {
        icon: Users,
        name: 'NaijaAjo',
        tagline: 'Digital Cooperative Savings',
        description:
            'Join or create a digital ajo group. Contribute regularly and receive your payout on rotation — the trusted susu model, modernised.',
        color: 'from-emerald-500 to-teal-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        perks: ['2–20 members per group', 'Weekly / bi-weekly / monthly', 'Dispute resolution built-in'],
    },
    {
        icon: PiggyBank,
        name: 'NaijaSafe',
        tagline: 'Personal Savings Platform',
        description:
            'Flexible savings, locked savings with interest, or goal-based savings. Set a target, watch it grow, get notified when you hit it.',
        color: 'from-blue-500 to-cyan-400',
        bg: 'bg-blue-500/10 dark:bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        perks: ['Flexible anytime withdrawals', 'Locked savings with interest', 'Goal tracker with milestones'],
    },
    {
        icon: BarChart3,
        name: 'TradeCred',
        tagline: 'Alternative Credit Score',
        description:
            'Your NaijaImpact activity builds your credit score (0–1000). Savings, transactions, cooperative history — all count toward better loan access.',
        color: 'from-violet-500 to-purple-500',
        bg: 'bg-violet-500/10 dark:bg-violet-500/10',
        border: 'border-violet-500/20',
        text: 'text-violet-600 dark:text-violet-400',
        perks: ['Starter → Platinum tiers', '6-category score breakdown', 'Personalised improvement tips'],
    },
    {
        icon: CreditCard,
        name: 'NaijaCredit',
        tagline: 'Micro-Lending',
        description:
            'Apply for microloans based on your TradeCred score. Choose your product, select tenure, and get funds disbursed to your wallet instantly.',
        color: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-500/10 dark:bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        perks: ['TradeCred score-based approval', 'Flexible repayment schedules', 'Track repayments in-app'],
    },
    {
        icon: Shield,
        name: 'NaijaInsure',
        tagline: 'Micro-Insurance',
        description:
            'Affordable insurance products for everyday Nigerians. Browse, purchase, and file claims — all without leaving the platform.',
        color: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-600 dark:text-rose-400',
        perks: ['Pay premiums from wallet', 'File claims with documents', 'Track policy status live'],
    },
]

export default function FintechSection()
{
    return (
        <section id="fintech" className="relative py-24 md:py-36 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-white dark:bg-slate-900" />
                <div
                    className="absolute bottom-0 right-0 w-[600px] h-[400px] opacity-10 dark:opacity-5"
                    style={{
                        background: 'radial-gradient(ellipse, hsl(199,100%,43%) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-[400px] h-[400px] opacity-10 dark:opacity-5"
                    style={{
                        background: 'radial-gradient(circle, hsl(166,76%,40%) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
            </div>

            <div className="container-gutter mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                        NaijaFintech Suite
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                        Financial freedom,{' '}
                        <span
                            style={{
                                backgroundImage: 'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            built for Nigeria
                        </span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                        Five integrated fintech products that help you save smarter, build credit, access loans,
                        and protect what matters — all without leaving NaijaImpact.
                    </p>
                </div>

                {/* Product cards — responsive grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product, i) =>
                    {
                        const Icon = product.icon
                        return (
                            <div
                                key={i}
                                className={`group bento-card noise-bg p-7 ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                            >
                                {/* Icon + badge */}
                                <div className="flex items-start justify-between mb-5">
                                    <div
                                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${product.bg} ${product.border} ${product.text}`}
                                    >
                                        {product.tagline}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                    {product.name}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">
                                    {product.description}
                                </p>

                                {/* Perks */}
                                <ul className="space-y-2">
                                    {product.perks.map((perk, j) => (
                                        <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${product.text}`} />
                                            {perk}
                                        </li>
                                    ))}
                                </ul>

                                {/* Hover overlay */}
                                <div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* CTA strip */}
                <div className="mt-14 bento-card noise-bg p-8 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Ready to take control of your finances?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                All five fintech products are included in your free NaijaImpact account.
                            </p>
                        </div>
                        <Link
                            href="/auth/signup"
                            className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 text-sm"
                        >
                            Start for free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
