'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TradeCredScore, TradeCredActivityLog, TradeCredTier } from '@/lib/types'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Resolve the platform users.id from the auth session. */
async function resolveProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  return { authUser: user, profile }
}

/** Determine tier from score value. */
function scoreToTier(score: number): TradeCredTier {
  if (score >= 900) return 'platinum'
  if (score >= 700) return 'gold'
  if (score >= 500) return 'silver'
  if (score >= 300) return 'bronze'
  return 'starter'
}

// ─── Score Calculation Weights ───────────────────────────────────────────────
// Each category contributes up to its max_points towards the total 1000 score.
const CATEGORY_WEIGHTS = {
  savings: 200,
  transactions: 200,
  cooperative: 150,
  marketplace: 150,
  referral: 150,
  learning: 150,
} as const

export type ScoreCategory = keyof typeof CATEGORY_WEIGHTS

/**
 * Derive a breakdown score for each category by querying related tables.
 * Returns a record of { category: points } where points is 0–max for that category.
 */
async function computeCategoryBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Record<ScoreCategory, number>> {
  // Run all lookups in parallel
  const [
    { data: flexAccounts },
    { data: lockedSavings },
    { data: goalSavings },
    { data: transactions },
    { data: ajoMemberships },
    { count: courseCount },
    { count: serviceCount },
    { count: referralCount },
  ] = await Promise.all([
    supabase
      .from('fintech_safe_flexible_accounts')
      .select('balance')
      .eq('user_id', userId),
    supabase
      .from('fintech_safe_locked_savings')
      .select('amount, status')
      .eq('user_id', userId),
    supabase
      .from('fintech_safe_goal_savings')
      .select('current_amount, status')
      .eq('user_id', userId),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', userId)
      .eq('status', 'success')
      .limit(200),
    supabase
      .from('fintech_ajo_members')
      .select('id, status')
      .eq('user_id', userId),
    supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', userId)
      .eq('active', true),
    supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
  ])

  // ── Savings category ───────────────────────────────────────────────────────
  const flexTotal = (flexAccounts ?? []).reduce((s, a) => s + (a.balance ?? 0), 0)
  const lockedTotal = (lockedSavings ?? [])
    .filter((s) => s.status !== 'withdrawn')
    .reduce((s, a) => s + (a.amount ?? 0), 0)
  const goalTotal = (goalSavings ?? []).reduce((s, g) => s + (g.current_amount ?? 0), 0)
  const totalSavings = flexTotal + lockedTotal + goalTotal
  // ₦100,000+ = full savings score
  const savingsScore = Math.min(CATEGORY_WEIGHTS.savings, Math.floor((totalSavings / 100000) * CATEGORY_WEIGHTS.savings))

  // ── Transactions category ──────────────────────────────────────────────────
  const txCount = transactions?.length ?? 0
  // 100+ successful transactions = full score
  const transactionsScore = Math.min(CATEGORY_WEIGHTS.transactions, Math.floor((txCount / 100) * CATEGORY_WEIGHTS.transactions))

  // ── Cooperative category ───────────────────────────────────────────────────
  const activeAjo = (ajoMemberships ?? []).filter((m) => m.status === 'active').length
  // 3+ active Ajo groups = full score
  const cooperativeScore = Math.min(CATEGORY_WEIGHTS.cooperative, Math.floor((activeAjo / 3) * CATEGORY_WEIGHTS.cooperative))

  // ── Marketplace category ───────────────────────────────────────────────────
  const serviceCount_ = serviceCount ?? 0
  // 5+ active services = full score
  const marketplaceScore = Math.min(CATEGORY_WEIGHTS.marketplace, Math.floor((serviceCount_ / 5) * CATEGORY_WEIGHTS.marketplace))

  // ── Referral category ─────────────────────────────────────────────────────
  const followerCount = referralCount ?? 0
  // 20+ followers = full score (using follows as proxy for referral network)
  const referralScore = Math.min(CATEGORY_WEIGHTS.referral, Math.floor((followerCount / 20) * CATEGORY_WEIGHTS.referral))

  // ── Learning category ─────────────────────────────────────────────────────
  const completedCourses = courseCount ?? 0
  // 5+ completed courses = full score
  const learningScore = Math.min(CATEGORY_WEIGHTS.learning, Math.floor((completedCourses / 5) * CATEGORY_WEIGHTS.learning))

  return {
    savings: savingsScore,
    transactions: transactionsScore,
    cooperative: cooperativeScore,
    marketplace: marketplaceScore,
    referral: referralScore,
    learning: learningScore,
  }
}

// ─── recalculateScore ─────────────────────────────────────────────────────────

export async function recalculateScore(): Promise<
  ActionResult<{ score: number; tier: TradeCredTier; breakdown: Record<ScoreCategory, number> }>
> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    const breakdown = await computeCategoryBreakdown(supabase, profile.id)
    const newScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
    const newTier = scoreToTier(newScore)

    // Upsert the score record
    const { error: upsertError } = await supabase
      .from('fintech_tradecred_scores')
      .upsert(
        {
          user_id: profile.id,
          score: newScore,
          tier: newTier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error('[recalculateScore] upsert error:', upsertError)
      return { success: false, error: 'Failed to update score. Please try again.' }
    }

    // Log the recalculation event
    await supabase.from('fintech_tradecred_activity_logs').insert({
      user_id: profile.id,
      event_type: 'score_recalculated',
      point_impact: 0,
      description: `Score recalculated to ${newScore} (${newTier})`,
    })

    revalidatePath('/app/fintech/tradecred')
    return { success: true, data: { score: newScore, tier: newTier, breakdown } }
  } catch (err) {
    console.error('[recalculateScore] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── logActivity ─────────────────────────────────────────────────────────────

export interface LogActivityInput {
  event_type: string
  point_impact: number
  description: string
}

export async function logActivity(
  input: LogActivityInput
): Promise<ActionResult<{ logId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!input.event_type || input.event_type.trim().length === 0) {
      return { success: false, error: 'Event type is required.' }
    }
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: 'Description is required.' }
    }

    const { data: log, error: insertError } = await supabase
      .from('fintech_tradecred_activity_logs')
      .insert({
        user_id: profile.id,
        event_type: input.event_type.trim(),
        point_impact: input.point_impact,
        description: input.description.trim(),
      })
      .select('id')
      .single()

    if (insertError || !log) {
      console.error('[logActivity] insert error:', insertError)
      return { success: false, error: 'Failed to log activity. Please try again.' }
    }

    // Apply point impact to current score
    if (input.point_impact !== 0) {
      const { data: scoreRow } = await supabase
        .from('fintech_tradecred_scores')
        .select('score')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (scoreRow) {
        const currentScore = scoreRow.score ?? 300
        const newScore = Math.max(0, Math.min(1000, currentScore + input.point_impact))
        const newTier = scoreToTier(newScore)

        await supabase
          .from('fintech_tradecred_scores')
          .update({ score: newScore, tier: newTier, updated_at: new Date().toISOString() })
          .eq('user_id', profile.id)
      }
    }

    revalidatePath('/app/fintech/tradecred')
    return { success: true, data: { logId: log.id } }
  } catch (err) {
    console.error('[logActivity] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
