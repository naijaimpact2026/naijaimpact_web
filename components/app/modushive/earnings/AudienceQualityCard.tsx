'use client'

import React from 'react'
import {
    Activity,
    Award,
    Clock,
    Flame,
    Lightbulb,
    Target,
    Users,
} from 'lucide-react'

interface AudienceQualityCardProps {
    audienceQuality: {
        returningViewersPercent: number
        avgWatchTimeMinutes: number
        conversionRatePercent: number
        totalStreams: number
        totalHoursLive: number
    }
}

export default function AudienceQualityCard({ audienceQuality }: AudienceQualityCardProps) {
    return (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                        <Award className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                            Audience Quality & Engagement Score
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            NovoStream rewards genuine buying intent and community trust over vanity follower counts.
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500 self-start sm:self-center">
                    <Flame className="h-3.5 w-3.5" />
                    {audienceQuality.totalStreams > 0 ? 'Active Community Tier' : 'Ready for First Broadcast'}
                </div>
            </div>

            {/* Quality Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Metric 1: Returning Viewers */}
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Returning Viewers
                        </span>
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                        {audienceQuality.returningViewersPercent}%
                    </p>
                    <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${audienceQuality.totalStreams > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                        <span className="text-[10px] text-muted-foreground">
                            {audienceQuality.totalStreams > 0 ? 'Benchmark: >40% is healthy' : 'Starts on first broadcast'}
                        </span>
                    </div>
                </div>

                {/* Metric 2: Avg Watch Time */}
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Avg Watch Time
                        </span>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                        {audienceQuality.avgWatchTimeMinutes}m
                    </p>
                    <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${audienceQuality.totalStreams > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                        <span className="text-[10px] text-muted-foreground">
                            {audienceQuality.totalStreams > 0 ? 'High retention depth' : 'Tracked per stream'}
                        </span>
                    </div>
                </div>

                {/* Metric 3: Conversion Rate */}
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Conversion Rate
                        </span>
                        <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                        {audienceQuality.conversionRatePercent}%
                    </p>
                    <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${audienceQuality.totalStreams > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                        <span className="text-[10px] text-muted-foreground">
                            {audienceQuality.totalStreams > 0 ? 'Tips & ticket purchases' : 'Orders / live attendees'}
                        </span>
                    </div>
                </div>

                {/* Metric 4: Total Streams & Hours */}
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Broadcast Volume
                        </span>
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                        {audienceQuality.totalHoursLive}h
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                            {audienceQuality.totalStreams} broadcast sessions
                        </span>
                    </div>
                </div>
            </div>

            {/* Quality Philosophy Note */}
            <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-500">
                    <Lightbulb className="h-4 w-4" />
                </span>
                <div className="space-y-1 text-xs">
                    <p className="font-bold text-foreground">
                        Why 50 engaged community members out-earn 10,000 passive scrollers
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        In the NovoStream monetization loop, earnings come directly from community value. When 10
                        viewers purchase a ₦2,500 workshop ticket and 2 buy your pinned storefront product, you earn
                        over ₦50,000 on a single 45-minute broadcast—regardless of your follower count.
                    </p>
                </div>
            </div>
        </div>
    )
}
