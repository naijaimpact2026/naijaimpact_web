import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignById } from '@/lib/actions/funding'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, Target } from 'lucide-react'
import FundingDetailClient from '@/components/app/funding/FundingDetailClient'
import EditCampaignButton from '@/components/app/funding/EditCampaignButton'

export const dynamic = 'force-dynamic'

interface CampaignDetailPageProps
{
    params: Promise<{ id: string }>
}

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getDeadlineLabel(deadline: string): { label: string; isEnded: boolean }
{
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffMs = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return { label: 'Ended', isEnded: true }
    if (diffDays === 1) return { label: '1 day left', isEnded: false }
    return { label: `${diffDays} days left`, isEnded: false }
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps)
{
    const { id } = await params
    const campaign = await fetchCampaignById(id)

    if (!campaign) notFound()

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let userEmail = ''
    let isCreator = false

    if (authUser)
    {
        userEmail = authUser.email ?? ''
        // Fetch the profile id to compare with campaign.creator_id
        const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single()
        isCreator = profile?.id === campaign.creator_id
    }

    const progressPct = Math.min(
        100,
        campaign.goal_amount > 0 ? (campaign.amount_raised / campaign.goal_amount) * 100 : 0
    )
    const goalReached = campaign.amount_raised >= campaign.goal_amount
    const { label: deadlineLabel, isEnded } = getDeadlineLabel(campaign.deadline)
    const deadlineFormatted = new Date(campaign.deadline).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <>
            {/* Paystack inline JS */}
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Back link */}
                <Link
                    href="/app/funding"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Funding
                </Link>

                {/* Hero cover image */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted">
                    {campaign.cover_url ? (
                        <Image
                            src={campaign.cover_url}
                            alt={campaign.title}
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 896px"
                        />
                    ) : (
                        <div className="absolute inset-0 gradient-primary opacity-60 flex items-center justify-center">
                            <span className="text-white/80 text-6xl">🌍</span>
                        </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-4 left-4">
                        <Badge className="capitalize bg-black/50 text-white border-0 backdrop-blur-sm">
                            {campaign.type}
                        </Badge>
                    </div>

                    {goalReached && (
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-green-500 text-white border-0 font-semibold text-sm px-3 py-1">
                                🎯 Goal Reached!
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: title + description */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold leading-tight">{campaign.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                by{' '}
                                <Link
                                    href={`/app/profile/${campaign.creator.username}`}
                                    className="text-primary hover:underline font-medium"
                                >
                                    @{campaign.creator.username}
                                </Link>
                            </p>
                        </div>

                        {campaign.description && (
                            <div className="bento-card noise-bg p-5">
                                <h2 className="font-semibold mb-3 relative z-10">About this campaign</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap relative z-10">
                                    {campaign.description}
                                </p>
                            </div>
                        )}

                        {/* Creator info card */}
                        <div className="bento-card noise-bg p-5">
                            <h2 className="font-semibold mb-4 relative z-10">About the creator</h2>
                            <div className="flex items-start gap-4 relative z-10">
                                <Link href={`/app/profile/${campaign.creator.username}`}>
                                    <Avatar className="h-14 w-14 border-2 border-border">
                                        <AvatarImage src={campaign.creator.avatar_url ?? undefined} />
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                                            {campaign.creator.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            href={`/app/profile/${campaign.creator.username}`}
                                            className="font-semibold hover:text-primary transition-colors"
                                        >
                                            {campaign.creator_display_name}
                                        </Link>
                                        {campaign.creator_verified && (
                                            <Badge className="bg-primary/10 text-primary border-0 text-xs px-2 py-0">
                                                ✓ Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        @{campaign.creator.username}
                                    </p>
                                    {campaign.creator_profession && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {campaign.creator_profession}
                                        </p>
                                    )}
                                    {campaign.creator_bio && (
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                            {campaign.creator_bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: funding stats + donate */}
                    <div className="space-y-4">
                        <div className="bento-card noise-bg p-5 space-y-5 sticky top-6">
                            {/* Progress */}
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {formatNGN(campaign.amount_raised)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            raised of {formatNGN(campaign.goal_amount)} goal
                                        </p>
                                    </div>
                                    {goalReached && (
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                            100%
                                        </Badge>
                                    )}
                                </div>

                                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${goalReached
                                            ? 'bg-green-500'
                                            : 'bg-gradient-to-r from-primary to-secondary'
                                            }`}
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>

                                <p className="text-sm font-medium text-right text-muted-foreground">
                                    {progressPct.toFixed(1)}% funded
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 gap-3 relative z-10">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{campaign.donor_count.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">donors</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                        <Target className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{formatNGN(campaign.goal_amount)}</p>
                                        <p className="text-xs text-muted-foreground">goal amount</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEnded ? 'bg-destructive/10' : 'bg-orange-500/10'
                                            }`}
                                    >
                                        <Calendar
                                            className={`h-4 w-4 ${isEnded ? 'text-destructive' : 'text-orange-500'}`}
                                        />
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isEnded ? 'text-destructive' : ''}`}>
                                            {deadlineLabel}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{deadlineFormatted}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Donate button — client component to manage modal */}
                            <div className="relative z-10 space-y-2">
                                {isCreator && (
                                    <EditCampaignButton campaignId={campaign.id} />
                                )}
                                <FundingDetailClient
                                    campaignId={campaign.id}
                                    campaignTitle={campaign.title}
                                    userEmail={userEmail}
                                    isEnded={isEnded}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
