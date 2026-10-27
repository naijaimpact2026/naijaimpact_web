import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Hammer, TrendingUp, Target, HandCoins, ArrowRight } from 'lucide-react'
import { toPublicStorageUrl } from '@/lib/supabase-image'
import type { FundingAd } from '@/lib/actions/funding-ads'

const JOURNEY = [
    { icon: BookOpen, label: 'Learn' },
    { icon: Hammer, label: 'Practice' },
    { icon: TrendingUp, label: 'Earn' },
    { icon: Target, label: 'Impact' },
]

function fmtGoal(amount: number): string
{
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`
    return `₦${amount.toLocaleString('en-NG')}`
}

interface ContinueLearning
{
    courseId: string
    title: string
    coverImageUrl: string | null
    progress: number
}

interface LearnRightSidebarProps
{
    continueLearning: ContinueLearning | null
    featuredFunding: FundingAd[]
}

export default function LearnRightSidebar({ continueLearning, featuredFunding = [] }: LearnRightSidebarProps)
{
    const progress = continueLearning?.progress ?? 0
    const circumference = 2 * Math.PI * 34
    const offset = circumference - (progress / 100) * circumference
    const coverUrl = continueLearning?.coverImageUrl ? toPublicStorageUrl(continueLearning.coverImageUrl) : null

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
            {/* My Learning Progress — real, from actual enrollment progress */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">My Learning Progress</h3>
                    <Link href="/app/learn?view=my-courses" className="text-xs font-semibold text-primary hover:underline">View All</Link>
                </div>

                {continueLearning ? (
                    <>
                        <div className="flex items-center gap-4">
                            <svg viewBox="0 0 80 80" className="w-20 h-20 shrink-0 -rotate-90">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                                <circle
                                    cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="8"
                                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                                    className="text-primary transition-all duration-500"
                                />
                                <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center text-lg font-black fill-foreground" style={{ transform: 'rotate(90deg)', transformOrigin: '40px 40px' }}>
                                    {progress}%
                                </text>
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-foreground">Keep Going!</p>
                                <p className="text-xs text-muted-foreground mt-0.5">You&apos;re making great progress.</p>
                            </div>
                        </div>

                        <Link href={`/app/learn/${continueLearning.courseId}`} className="mt-4 flex items-center gap-3 rounded-xl bg-muted p-2.5 hover:bg-muted/70 transition-colors">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-card shrink-0">
                                {coverUrl && <Image src={coverUrl} alt={continueLearning.title} fill className="object-cover" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-foreground truncate">{continueLearning.title}</p>
                                <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </Link>

                        <Link href={`/app/learn/${continueLearning.courseId}`} className="mt-3 block w-full text-center bg-primary text-white text-xs font-bold py-2.5 rounded-full hover:bg-primary/90 transition-colors">
                            Continue Learning
                        </Link>
                    </>
                ) : (
                    <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground mb-3">Enrol in a course to start tracking your progress here.</p>
                        <Link href="/app/learn?view=catalogue" className="inline-block bg-primary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
                            Browse Courses
                        </Link>
                    </div>
                )}

                {/* Your Journey */}
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">Your Journey</p>
                    <div className="flex items-center justify-between">
                        {JOURNEY.map((step, i) => (
                            <div key={step.label} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground">{step.label}</span>
                                </div>
                                {i < JOURNEY.length - 1 && <div className="h-px flex-1 bg-border mx-1 mb-4" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Funding Opportunities — real campaigns from the funding table */}
            {featuredFunding.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <HandCoins className="w-3.5 h-3.5 text-primary" /> Funding Opportunities
                        </h3>
                        <Link href="/app/funding" className="text-xs font-semibold text-primary hover:underline">See All</Link>
                    </div>
                    <div className="space-y-3">
                        {featuredFunding.map((ad) => {
                            const coverUrl = ad.cover_image_url ? toPublicStorageUrl(ad.cover_image_url) : null
                            return (
                                <Link
                                    key={ad.id}
                                    href="/app/funding"
                                    className="flex items-center gap-3 rounded-xl hover:bg-muted p-1.5 -m-1.5 transition-colors group"
                                >
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                        {coverUrl ? (
                                            <Image src={coverUrl} alt={ad.title} fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                                                <HandCoins className="w-5 h-5 text-white/70" />
                                            </div>
                                        )}
                                        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-black/60 text-white">
                                            {ad.funding_type}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{ad.title}</p>
                                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{ad.impact || ad.description}</p>
                                        <p className="text-[11px] font-bold text-primary mt-0.5">Goal: {fmtGoal(ad.goal_amount)}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                    <Link
                        href="/app/funding"
                        className="mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-bold text-primary border border-primary/30 rounded-full py-2 hover:bg-primary/10 transition-colors"
                    >
                        Support a Project <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
        </aside>
    )
}
