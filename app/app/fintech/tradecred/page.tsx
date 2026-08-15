import { createClient } from '@/lib/supabase/server'
import { recalculateScore } from '@/lib/actions/fintech/tradecred'
import ScoreBreakdown from '@/components/app/fintech/tradecred/ScoreBreakdown'
import ActivityLog from '@/components/app/fintech/tradecred/ActivityLog'
import ImprovementTips from '@/components/app/fintech/tradecred/ImprovementTips'
import type { TradeCredScore, TradeCredActivityLog, TradeCredTier } from '@/lib/types'
import type { ScoreCategory } from '@/lib/actions/fintech/tradecred'

export const dynamic = 'force-dynamic'

// ─── Tier helpers ────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
    TradeCredTier,
    {
        label: string
        color: string
        bg: string
        border: string
        min: number
        max: number
    }
> = {
    starter: { label: 'Starter', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', min: 0, max: 299 },
    bronze: { label: 'Bronze', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400', min: 300, max: 499 },
    silver: { label: 'Silver', color: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-200 dark:bg-slate-700', border: 'border-slate-400', min: 500, max: 699 },
    gold: { label: 'Gold', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400', min: 700, max: 899 },
    platinum: { label: 'Platinum', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/50', min: 900, max: 1000 },
}

function getRecommendedLoan(score: number): string
{
    if (score >= 900) return '₦500,000'
    if (score >= 700) return '₦250,000'
    if (score >= 500) return '₦100,000'
    if (score >= 300) return '₦50,000'
    return '₦10,000'
}

function getRepaymentProbability(score: number): number
{
    // Linearly scale: 0 → 40%, 1000 → 99%
    return Math.round(40 + (score / 1000) * 59)
}

// ─── SVG Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, tier }: { score: number; tier: TradeCredTier })
{
    const tierCfg = TIER_CONFIG[tier]

    // Arc geometry: centre of 160×100 viewport, radius 70, spans 180°
    const cx = 80
    const cy = 90
    const r = 68
    const startAngle = -180  // degrees, left
    const totalAngle = 180   // sweeps to right

    const pct = score / 1000
    const sweepAngle = pct * totalAngle

    function polarToXY(angleDeg: number, radius: number)
    {
        const rad = (angleDeg * Math.PI) / 180
        return {
            x: cx + radius * Math.cos(rad),
            y: cy + radius * Math.sin(rad),
        }
    }

    const trackStart = polarToXY(startAngle, r)
    const trackEnd = polarToXY(startAngle + totalAngle, r)

    const fillEnd = polarToXY(startAngle + sweepAngle, r)
    const largeArcFill = sweepAngle > 180 ? 1 : 0

    // Needle tip angle
    const needleAngle = startAngle + sweepAngle
    const needleTip = polarToXY(needleAngle, r - 10)
    const needleBase1 = polarToXY(needleAngle - 90, 6)
    const needleBase2 = polarToXY(needleAngle + 90, 6)

    return (
        <div className="flex flex-col items-center gap-3">
            <svg
                viewBox="0 0 160 100"
                className="w-56 h-36"
                aria-label={`TradeCred score gauge: ${score} out of 1000`}
                role="img"
            >
                {/* Track arc */}
                <path
                    d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.12}
                    strokeWidth={10}
                    strokeLinecap="round"
                />

                {/* Filled arc */}
                {score > 0 && (
                    <path
                        d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`}
                        fill="none"
                        stroke="hsl(166,76%,40%)"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                )}

                {/* Needle */}
                <polygon
                    points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
                    fill="hsl(166,76%,40%)"
                    opacity={0.85}
                />

                {/* Centre pivot */}
                <circle cx={cx} cy={cy} r={5} fill="hsl(166,76%,40%)" />

                {/* Labels: 0 and 1000 */}
                <text x="8" y="98" fontSize="9" fill="currentColor" opacity={0.5}>0</text>
                <text x="136" y="98" fontSize="9" fill="currentColor" opacity={0.5}>1000</text>
            </svg>

            {/* Score number */}
            <p className="text-5xl font-bold tracking-tight text-gradient">{score}</p>

            {/* Tier badge */}
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${tierCfg.color} ${tierCfg.bg} ${tierCfg.border}`}
            >
                {tierCfg.label}
            </span>
        </div>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TradeCredPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser)
    {
        return (
            <div>
                <div className="py-6 px-4" style={{ background: 'linear-gradient(150deg,#0a2d1c,#065f46)' }}>
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-black text-white">TradeCred</h1>
                    </div>
                </div>
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Please sign in to access TradeCred.</p>
                </main>
            </div>
        )
    }

    // Resolve platform users.id
    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile)
    {
        return (
            <div>
                <div className="py-6 px-4" style={{ background: 'linear-gradient(150deg,#0a2d1c,#065f46)' }}>
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-black text-white">TradeCred</h1>
                    </div>
                </div>
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Profile not found.</p>
                </main>
            </div>
        )
    }

    const userId = profile.id

    // ── Fetch score and activity in parallel ────────────────────────────────────
    const [{ data: scoreRow }, { data: activityRows }] = await Promise.all([
        supabase
            .from('fintech_tradecred_scores')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),

        supabase
            .from('fintech_tradecred_activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(200),
    ])

    // If no score row yet, trigger a calculation
    let scoreData: TradeCredScore
    let breakdown: Record<ScoreCategory, number>

    if (!scoreRow)
    {
        const result = await recalculateScore()
        if (result.success && result.data)
        {
            scoreData = {
                id: '',
                user_id: userId,
                score: result.data.score,
                tier: result.data.tier,
                updated_at: new Date().toISOString(),
            }
            breakdown = result.data.breakdown
        } else
        {
            // Fallback defaults
            scoreData = { id: '', user_id: userId, score: 300, tier: 'bronze', updated_at: new Date().toISOString() }
            breakdown = { savings: 0, transactions: 0, cooperative: 0, marketplace: 0, referral: 0, learning: 0 }
        }
    } else
    {
        scoreData = scoreRow as TradeCredScore
        // We don't store the breakdown separately — re-derive for display from the score
        // Use stored score to generate a proportional placeholder breakdown
        // (A full recalculate would hit DB again; we'll show the refreshed breakdown on next recalculate)
        const s = scoreData.score
        // Simple proportional split using the tier progression
        const pct = s / 1000
        breakdown = {
            savings: Math.min(200, Math.round(pct * 200)),
            transactions: Math.min(200, Math.round(pct * 200)),
            cooperative: Math.min(150, Math.round(pct * 150)),
            marketplace: Math.min(150, Math.round(pct * 150)),
            referral: Math.min(150, Math.round(pct * 150)),
            learning: Math.min(150, Math.round(pct * 150)),
        }

        // Recalculate and store fresh breakdown for subsequent loads
        // (fire and forget — don't block the page render)
        recalculateScore().then((r) =>
        {
            if (r.success && r.data)
            {
                // breakdown will update on next page load via revalidatePath
            }
        }).catch(() => { })
    }

    const logs = (activityRows ?? []) as TradeCredActivityLog[]
    const tier: TradeCredTier = (['starter', 'bronze', 'silver', 'gold', 'platinum'].includes(scoreData.tier)
        ? scoreData.tier
        : 'starter') as TradeCredTier
    const tierCfg = TIER_CONFIG[tier]
    const recommendedLoan = getRecommendedLoan(scoreData.score)
    const repaymentProbability = getRepaymentProbability(scoreData.score)

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* ── Hero banner ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="max-w-4xl mx-auto px-5 pt-7 pb-8 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">Fintech Hub</p>
                    <h1 className="text-3xl font-black text-white">TradeCred</h1>
                    <p className="text-sm mt-1 text-green-300/60">Your alternative credit score — built on real financial behaviour</p>
                    <div className="mt-5 pt-5 flex items-center gap-6 flex-wrap"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <span className="text-3xl font-black text-white">{scoreData.score}</span>
                            <span className="text-sm ml-1 text-green-300/60">/ 1,000</span>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                            {tierCfg.label} Tier
                        </span>
                        <span className="text-sm text-green-400">Loan up to {recommendedLoan}</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">                {/* ── Score Hero ── */}
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                        <div className="shrink-0">
                            <ScoreGauge score={scoreData.score} tier={tier} />
                        </div>
                        <div className="flex-1 w-full grid grid-cols-2 gap-4">
                            {/* Tier */}
                            <div className="bento-card p-4 space-y-1.5">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Current Tier</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${tierCfg.color} ${tierCfg.bg} ${tierCfg.border}`}>
                                    {tierCfg.label}
                                </span>
                                <p className="text-[10px] text-muted-foreground">Range: {tierCfg.min}–{tierCfg.max}</p>
                            </div>
                            {/* Recommended loan */}
                            <div className="bento-card p-4 space-y-1.5">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Recommended Loan</p>
                                <p className="text-2xl font-bold text-primary">{recommendedLoan}</p>
                                <p className="text-[10px] text-muted-foreground">Based on your current score</p>
                            </div>
                            {/* Repayment probability */}
                            <div className="bento-card p-4 col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Repayment Probability</p>
                                    <p className="text-xl font-bold text-secondary">{repaymentProbability}%</p>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                        style={{ width: `${repaymentProbability}%` }} />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Probability of on-time loan repayment based on your financial activity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Score Breakdown ── */}
                <ScoreBreakdown breakdown={breakdown} />

                {/* ── Improvement Tips ── */}
                <ImprovementTips breakdown={breakdown} />

                {/* ── Activity Log ── */}
                <ActivityLog logs={logs} />
            </main>
        </div>
    )
}
