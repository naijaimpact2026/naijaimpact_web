import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import AllFeaturesGrid from '@/components/app/home/AllFeaturesGrid'
import Link from 'next/link'
import { ArrowLeft, Compass, Sparkles, ShieldCheck, Users, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Platform Directory & Ecosystem | Hubnovo',
    description: 'Explore all 10 specialized engines and platforms in the Hubnovo ecosystem.',
}

export default async function ExplorePage() {
    const { authUser, profile } = await getCurrentUser()

    if (!authUser) redirect('/auth/login')
    if (!profile) redirect('/app/settings/onboarding')

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <Link
                    href="/app"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full shadow-2xs">
                        <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>Platform Directory</span>
                    </span>
                </div>
            </div>

            {/* Dedicated Hero Header */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-10 backdrop-blur-xl shadow-sm">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hubnovo Ecosystem</span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                        Ten Engines for Growth, Trade & Impact
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Every tool you need to thrive in the Nigerian economy. Connect with certified artisans, learn vocational & tech skills, trade with secure escrow, discover jobs, and raise community funding.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>100% Escrow Protected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>Verified Identity & Community</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>Instant Direct Communication</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* The 3-Column Two-Tone Cards Grid */}
            <AllFeaturesGrid showHeader={false} />
        </div>
    )
}
