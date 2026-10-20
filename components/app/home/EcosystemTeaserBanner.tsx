import Link from 'next/link'
import {
    Compass,
    ArrowRight,
    Wrench,
    Users,
    ShoppingBag,
    BookOpen,
    Briefcase,
    Rocket,
    Wallet,
    HandCoins,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Radio,
} from 'lucide-react'

const MODULE_PILLS = [
    { label: 'Artisans & Pros', icon: Wrench, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { label: 'Community Feed', icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { label: 'Livestream', icon: Radio, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { label: 'Marketplace', icon: ShoppingBag, color: 'text-teal-500 bg-teal-500/10 border-teal-500/30' },
    { label: 'Skills Academy', icon: BookOpen, color: 'text-violet-500 bg-violet-500/10 border-violet-500/30' },
    { label: 'Jobs & Careers', icon: Briefcase, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
    { label: 'LaunchPad', icon: Rocket, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { label: 'Save & Wallet', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { label: 'Crowdfunding', icon: HandCoins, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
    { label: 'Direct Messages', icon: MessageSquare, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
]

export default function EcosystemTeaserBanner() {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
            {/* Ambient decorative radial glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Hubnovo Ecosystem Directory</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                        Explore All 10 Platform Engines
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        From verified local artisans and e-commerce trade to video skills courses, job opportunities, and milestone escrow wallet — browse the full platform directory on its dedicated page.
                    </p>

                    {/* Interactive module preview badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        {MODULE_PILLS.map((m) => {
                            const Icon = m.icon
                            return (
                                <span
                                    key={m.label}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-2xs ${m.color}`}
                                >
                                    <Icon className="w-3 h-3" />
                                    <span>{m.label}</span>
                                </span>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                    <Link
                        href="/app/explore"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group animate-heartbeat"
                    >
                        <span>Open Full Directory</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Escrow Protected &bull; Verified Community</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
