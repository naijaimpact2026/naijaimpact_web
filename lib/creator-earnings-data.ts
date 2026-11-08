/**
 * NovoStream Day-One Creator Earnings & Monetization Data Model
 * Based on the NovoStream Strategy Blueprint:
 * "Day-One Creator Earnings & Low-Cost Monetisation Loop"
 */

export type EarningRouteKey =
    | 'tips'
    | 'tickets'
    | 'marketplace'
    | 'affiliates'
    | 'sponsorships'

export type TransactionType =
    | 'tip'
    | 'ticket'
    | 'marketplace_sale'
    | 'affiliate_commission'
    | 'sponsorship'
    | 'withdrawal'

export type TransactionStatus = 'settled' | 'pending' | 'completed' | 'refunded'

export interface CreatorTransaction {
    id: string
    created_at: string
    title: string
    route_key: EarningRouteKey | 'payout'
    type: TransactionType
    payer_name?: string
    gross_amount: number
    payment_cost: number
    platform_fee: number
    net_amount: number
    status: TransactionStatus
    channel_or_stream?: string
    notes?: string
}

export interface EarningRouteConfig {
    id: EarningRouteKey
    name: string
    shortDesc: string
    creatorSharePercent: number // e.g. 90%
    platformFeePercent: number // e.g. 10%
    whoFundsIt: string
    icon: string
    badgeColor: string
    status: 'active' | 'setup_required' | 'locked'
}

export interface CreatorEarningsSummary {
    totalNetEarnedThisMonth: number
    monthGrowthPercent: number
    availableBalance: number
    pendingBalance: number
    totalWithdrawn: number
    lifetimeGross: number
    platformDeductionsTotal: number
    paymentGatewayCostsTotal: number
    routes: {
        tips: { gross: number; net: number; count: number; feePercent: number }
        tickets: { gross: number; net: number; count: number; feePercent: number }
        marketplace: { gross: number; net: number; count: number; feePercent: number }
        affiliates: { gross: number; net: number; count: number; feePercent: number }
        sponsorships: { gross: number; net: number; count: number; feePercent: number }
    }
    audienceQuality: {
        returningViewersPercent: number
        avgWatchTimeMinutes: number
        conversionRatePercent: number
        totalStreams: number
        totalHoursLive: number
    }
    transactions: CreatorTransaction[]
    nextActions: {
        id: string
        title: string
        description: string
        actionLabel: string
        actionHref: string
        priority: 'high' | 'medium'
    }[]
}

/**
 * 5 Core Day-One Routes per strategy document
 */
export const DAY_ONE_EARNING_ROUTES: EarningRouteConfig[] = [
    {
        id: 'tips',
        name: 'Viewer Tips & Fan Gifts',
        shortDesc: 'Live Naira tips and animated viewer gifts during broadcasts.',
        creatorSharePercent: 90,
        platformFeePercent: 10,
        whoFundsIt: 'Fans & community viewers',
        icon: 'Coins',
        badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        status: 'active',
    },
    {
        id: 'tickets',
        name: 'Paid Events & Mini-Classes',
        shortDesc: 'Live workshops, tutoring, masterclasses, and concert tickets.',
        creatorSharePercent: 90,
        platformFeePercent: 10,
        whoFundsIt: 'Attendees buying access tickets',
        icon: 'Calendar',
        badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        status: 'active',
    },
    {
        id: 'marketplace',
        name: 'Live Shopping & Storefront',
        shortDesc: 'Pinned products and service bookings from Hivenovo catalogue.',
        creatorSharePercent: 92,
        platformFeePercent: 8,
        whoFundsIt: 'Customers buying goods or services',
        icon: 'ShoppingBag',
        badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        status: 'active',
    },
    {
        id: 'affiliates',
        name: 'Affiliate & Referral Commissions',
        shortDesc: 'Tracked partner links for verified courses and tools.',
        creatorSharePercent: 85,
        platformFeePercent: 15,
        whoFundsIt: 'Partner merchants & course creators',
        icon: 'Link2',
        badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        status: 'active',
    },
    {
        id: 'sponsorships',
        name: 'Brand & Partner Sponsorships',
        shortDesc: 'Direct brand integration and skill-building campaigns.',
        creatorSharePercent: 90,
        platformFeePercent: 10,
        whoFundsIt: 'Commercial sponsors & organizations',
        icon: 'Handshake',
        badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        status: 'active',
    },
]
