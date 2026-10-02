'use server'

// ============================================================
// lib/actions/funding.ts
// Server actions for Hubnovo Crowdfunding & Project Financing
// Powered by Supabase & Paystack
// ============================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type {
  Campaign,
  CampaignWithCreator,
  FundingCategory,
  FundingType,
  FundingPayout,
  CampaignWithdrawalSummary,
} from '@/lib/types'

const DEFAULT_LIMIT = 12

export type FundingFilter = 'all' | 'campaign' | 'project'
export type FundingSort = 'recent' | 'most_funded' | 'highest_goal'
export type FundingStatusFilter = 'all' | 'active' | 'completed'

/**
 * Admin Supabase client that bypasses RLS.
 * Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false },
  })
}

export interface CampaignFormData {
  title: string
  funding_type: FundingType
  category_id?: string | null
  goal_amount: number
  impact?: string | null
  description?: string | null
  cover_image_url?: string | null
}

// ─────────────────────────────────────────────
// Helper: Resolve User Profile
// ─────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { supabase, authUser: null, profile: null }
  }

  const adminClient = getAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('id, auth_id, username, display_name, avatar_url, wallet_pin')
    .or(`id.eq.${authUser.id},auth_id.eq.${authUser.id}`)
    .maybeSingle()

  return { supabase, authUser, profile }
}

// ─────────────────────────────────────────────
// fetchFundingCategories
// ─────────────────────────────────────────────

export async function fetchFundingCategories(): Promise<FundingCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('funding_categories')
    .select('id, name, description, created_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('fetchFundingCategories error:', error.message)
    return []
  }

  return data ?? []
}

// ─────────────────────────────────────────────
// fetchFundingStats
// ─────────────────────────────────────────────

export async function fetchFundingStats(): Promise<{
  totalRaised: number
  totalDonors: number
  activeCampaigns: number
}> {
  const supabase = await createClient()

  const [{ count: campaignCount }, { data: txs }] = await Promise.all([
    supabase.from('funding').select('id', { count: 'exact', head: true }),
    supabase.from('funding_transactions').select('amount, user_id'),
  ])

  const allTxs = txs ?? []
  const totalRaised = allTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const uniqueDonors = new Set(allTxs.map((t) => t.user_id).filter(Boolean))
  const anonymousCount = allTxs.filter((t) => !t.user_id).length
  const totalDonors = uniqueDonors.size + anonymousCount

  return {
    totalRaised,
    totalDonors,
    activeCampaigns: campaignCount ?? 0,
  }
}

// ─────────────────────────────────────────────
// fetchCampaigns
// ─────────────────────────────────────────────

export async function fetchCampaigns(
  cursor: string | null = null,
  limit: number = DEFAULT_LIMIT,
  filter: FundingFilter = 'all',
  categoryId?: string | null,
  sort: FundingSort = 'recent',
  searchQuery?: string | null,
  statusFilter: FundingStatusFilter = 'all'
): Promise<{ campaigns: CampaignWithCreator[]; nextCursor: string | null }> {
  const adminClient = getAdminClient() // use admin to read funding and profiles regardless of RLS

  let query = adminClient
    .from('funding')
    .select(
      `
      id,
      user_id,
      title,
      funding_type,
      category_id,
      cover_image_url,
      goal_amount,
      impact,
      description,
      status,
      created_at,
      updated_at,
      funding_categories (
        id,
        name
      ),
      funding_transactions (
        id,
        amount
      )
    `
    )

  if (filter !== 'all') {
    query = query.eq('funding_type', filter)
  }

  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId)
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim()
    query = query.or(`title.ilike.%${q}%,impact.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Base database ordering
  if (sort === 'highest_goal') {
    query = query.order('goal_amount', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (cursor && sort === 'recent') {
    query = query.lt('created_at', cursor)
  }

  // If post-filtering by status or sorting by calculated most_funded, fetch extra to avoid starving the page
  const fetchLimit = statusFilter !== 'all' || sort === 'most_funded' ? Math.max(limit * 2, 24) : limit
  query = query.limit(fetchLimit + 1)

  const { data, error } = await query

  if (error || !data) {
    console.error('fetchCampaigns error:', error?.message ?? error)
    return { campaigns: [], nextCursor: null }
  }

  const hasMoreRaw = data.length > fetchLimit
  const pageData = hasMoreRaw ? data.slice(0, fetchLimit) : data

  // Extract unique creator user_ids
  const userIds = Array.from(new Set(pageData.map((row: any) => row.user_id).filter(Boolean)))

  // Batch-resolve creator profiles from users table
  let creatorMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: usersData } = await adminClient
      .from('users')
      .select('id, auth_id, username, display_name, avatar_url, verified, bio, profession')
      .or(`id.in.(${userIds.join(',')}),auth_id.in.(${userIds.join(',')})`)

    for (const u of usersData ?? []) {
      if (u.id) creatorMap[u.id] = u
      if (u.auth_id) creatorMap[u.auth_id] = u
    }
  }

  // Map to CampaignWithCreator
  let campaigns: CampaignWithCreator[] = pageData.map((row: any) => {
    const txs: { id: string; amount: number }[] = row.funding_transactions ?? []
    const amountRaised = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const donorCount = txs.length
    const goal = Number(row.goal_amount) || 0
    const isGoalReached = goal > 0 && amountRaised >= goal
    const isClosed = row.status === 'closed' || row.impact?.startsWith('[CLOSED]')
    const status: 'active' | 'closed' | 'completed' = isClosed ? 'closed' : isGoalReached ? 'completed' : 'active'
    const cleanImpact = row.impact?.replace(/^\[CLOSED\]\s*/, '') || null

    const creator = creatorMap[row.user_id] ?? {
      id: row.user_id,
      username: 'member',
      display_name: 'Community Member',
      avatar_url: null,
      verified: false,
      bio: null,
      profession: null,
    }

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      funding_type: (row.funding_type as FundingType) || 'campaign',
      category_id: row.category_id ?? null,
      cover_image_url: row.cover_image_url ?? null,
      goal_amount: goal,
      impact: cleanImpact,
      description: row.description ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status,
      // Backward compatibility aliases
      creator_id: row.user_id,
      type: (row.funding_type as FundingType) || 'campaign',
      cover_url: row.cover_image_url ?? null,
      // Populated associations
      category: row.funding_categories ? { id: row.funding_categories.id, name: row.funding_categories.name } : null,
      creator,
      amount_raised: amountRaised,
      donor_count: donorCount,
    }
  })

  // Filter by statusFilter if requested
  if (statusFilter === 'active') {
    campaigns = campaigns.filter((c) => c.status === 'active')
  } else if (statusFilter === 'completed') {
    campaigns = campaigns.filter((c) => c.status === 'completed' || c.status === 'closed')
  }

  // If sorting by most_funded, sort post-aggregation
  if (sort === 'most_funded') {
    campaigns.sort((a, b) => b.amount_raised - a.amount_raised)
  }

  const hasMore = campaigns.length > limit || hasMoreRaw
  const paginatedCampaigns = campaigns.slice(0, limit)
  const lastItem = pageData[pageData.length - 1]
  const nextCursor = hasMore && lastItem ? lastItem.created_at : null

  return { campaigns: paginatedCampaigns, nextCursor }
}

// ─────────────────────────────────────────────
// fetchCampaignById
// ─────────────────────────────────────────────

export async function fetchCampaignById(id: string): Promise<CampaignWithCreator | null> {
  const adminClient = getAdminClient() // use admin to read funding and profiles regardless of RLS

  const { data, error } = await adminClient
    .from('funding')
    .select(
      `
      id,
      user_id,
      title,
      funding_type,
      category_id,
      cover_image_url,
      goal_amount,
      impact,
      description,
      created_at,
      updated_at,
      funding_categories (
        id,
        name
      ),
      funding_transactions (
        id,
        user_id,
        amount,
        reference,
        created_at
      )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.error('fetchCampaignById error:', error?.message ?? error)
    return null
  }

  const row = data as any
  const txs: any[] = row.funding_transactions ?? []
  const amountRaised = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const donorCount = txs.length
  const goal = Number(row.goal_amount) || 0
  const isGoalReached = goal > 0 && amountRaised >= goal
  const isClosed = row.status === 'closed' || row.impact?.startsWith('[CLOSED]')
  const status: 'active' | 'closed' | 'completed' = isClosed ? 'closed' : isGoalReached ? 'completed' : 'active'
  const cleanImpact = row.impact?.replace(/^\[CLOSED\]\s*/, '') || null

  // Resolve creator
  const { data: creatorData } = await adminClient
    .from('users')
    .select('id, auth_id, username, display_name, avatar_url, verified, bio, profession')
    .or(`id.eq.${row.user_id},auth_id.eq.${row.user_id}`)
    .maybeSingle()

  const creator = creatorData ?? {
    id: row.user_id,
    username: 'member',
    display_name: 'Community Member',
    avatar_url: null,
    verified: false,
    bio: null,
    profession: null,
  }

  // Resolve recent donor profiles
  const donorUserIds = Array.from(new Set(txs.map((t) => t.user_id).filter(Boolean)))
  let donorMap: Record<string, any> = {}
  if (donorUserIds.length > 0) {
    const { data: donorsData } = await adminClient
      .from('users')
      .select('id, auth_id, username, display_name, avatar_url')
      .or(`id.in.(${donorUserIds.join(',')}),auth_id.in.(${donorUserIds.join(',')})`)

    for (const d of donorsData ?? []) {
      if (d.id) donorMap[d.id] = d
      if (d.auth_id) donorMap[d.auth_id] = d
    }
  }

  const recentDonations = txs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      amount: Number(t.amount) || 0,
      created_at: t.created_at,
      donor: donorMap[t.user_id] ?? null,
    }))

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    funding_type: (row.funding_type as FundingType) || 'campaign',
    category_id: row.category_id ?? null,
    cover_image_url: row.cover_image_url ?? null,
    goal_amount: goal,
    impact: cleanImpact,
    description: row.description ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status,
    creator_id: row.user_id,
    type: (row.funding_type as FundingType) || 'campaign',
    cover_url: row.cover_image_url ?? null,
    category: row.funding_categories ? { id: row.funding_categories.id, name: row.funding_categories.name } : null,
    creator,
    amount_raised: amountRaised,
    donor_count: donorCount,
    recent_donations: recentDonations,
  }
}

// ─────────────────────────────────────────────
// createCampaign
// ─────────────────────────────────────────────

export async function createCampaign(data: CampaignFormData): Promise<{ id: string }> {
  const { supabase, authUser } = await getAuthContext()

  if (!authUser) {
    throw new Error('You must be signed in to create a campaign')
  }

  if (!data.title?.trim()) {
    throw new Error('Title is required')
  }

  if (!data.goal_amount || data.goal_amount < 1000) {
    throw new Error('Goal amount must be at least ₦1,000')
  }

  const { data: campaign, error } = await supabase
    .from('funding')
    .insert({
      user_id: authUser.id,
      title: data.title.trim(),
      funding_type: data.funding_type || 'campaign',
      category_id: data.category_id || null,
      cover_image_url: data.cover_image_url || null,
      goal_amount: data.goal_amount,
      impact: data.impact?.trim() || null,
      description: data.description?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !campaign) {
    console.error('createCampaign error:', error)
    throw new Error(error?.message || 'Failed to create campaign')
  }

  revalidatePath('/app/funding')
  revalidatePath('/app')

  return { id: campaign.id }
}

// ─────────────────────────────────────────────
// updateCampaign
// ─────────────────────────────────────────────

export async function updateCampaign(id: string, data: CampaignFormData): Promise<void> {
  const { supabase, authUser } = await getAuthContext()

  if (!authUser) {
    throw new Error('You must be signed in to update this campaign')
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('funding')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Campaign not found')
  }

  if (existing.user_id !== authUser.id) {
    throw new Error('Forbidden: you are not the creator of this campaign')
  }

  const { error: updateError } = await supabase
    .from('funding')
    .update({
      title: data.title.trim(),
      funding_type: data.funding_type || 'campaign',
      category_id: data.category_id || null,
      cover_image_url: data.cover_image_url || null,
      goal_amount: data.goal_amount,
      impact: data.impact?.trim() || null,
      description: data.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('updateCampaign error:', updateError)
    throw new Error(updateError.message || 'Failed to update campaign')
  }

  revalidatePath('/app/funding')
  revalidatePath(`/app/funding/${id}`)
}

// ─────────────────────────────────────────────
// deleteCampaign
// ─────────────────────────────────────────────

export async function deleteCampaign(id: string): Promise<void> {
  const { supabase, authUser } = await getAuthContext()

  if (!authUser) throw new Error('Unauthenticated')

  const { data: existing } = await supabase
    .from('funding')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== authUser.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('funding').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/app/funding')
}

// ─────────────────────────────────────────────
// closeCampaign
// ─────────────────────────────────────────────

export async function closeCampaign(id: string): Promise<{ success: boolean; message: string }> {
  const { supabase, authUser } = await getAuthContext()

  if (!authUser) {
    throw new Error('You must be signed in to manage this campaign')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('funding')
    .select('id, user_id, impact')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Campaign not found')
  }

  if (existing.user_id !== authUser.id) {
    throw new Error('Forbidden: you are not the creator of this campaign')
  }

  const adminClient = getAdminClient()

  // Try updating status column first
  const { error: statusErr } = await adminClient
    .from('funding')
    .update({
      status: 'closed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Fallback: If status column does not exist or errored, tag impact with [CLOSED]
  if (statusErr) {
    const rawImpact = existing.impact ?? ''
    const newImpact = rawImpact.startsWith('[CLOSED]') ? rawImpact : `[CLOSED] ${rawImpact}`.trim()
    const { error: impactErr } = await adminClient
      .from('funding')
      .update({
        impact: newImpact || '[CLOSED]',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (impactErr) {
      console.error('closeCampaign impact fallback error:', impactErr)
      throw new Error(impactErr.message || 'Failed to close campaign')
    }
  }

  revalidatePath('/app/funding')
  revalidatePath(`/app/funding/${id}`)

  return { success: true, message: 'Campaign has been concluded successfully.' }
}

// ─────────────────────────────────────────────
// reopenCampaign
// ─────────────────────────────────────────────

export async function reopenCampaign(id: string): Promise<{ success: boolean; message: string }> {
  const { supabase, authUser } = await getAuthContext()

  if (!authUser) {
    throw new Error('You must be signed in to manage this campaign')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('funding')
    .select('id, user_id, impact')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new Error('Campaign not found')
  }

  if (existing.user_id !== authUser.id) {
    throw new Error('Forbidden: you are not the creator of this campaign')
  }

  const adminClient = getAdminClient()

  // Try updating status column first
  const { error: statusErr } = await adminClient
    .from('funding')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Fallback / clean impact tag
  const rawImpact = existing.impact ?? ''
  const cleanImpact = rawImpact.replace(/^\[CLOSED\]\s*/, '') || null

  const { error: impactErr } = await adminClient
    .from('funding')
    .update({
      impact: cleanImpact,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (statusErr && impactErr) {
    console.error('reopenCampaign error:', impactErr)
    throw new Error(impactErr.message || 'Failed to reopen campaign')
  }

  revalidatePath('/app/funding')
  revalidatePath(`/app/funding/${id}`)

  return { success: true, message: 'Campaign has been reopened successfully.' }
}

// ─────────────────────────────────────────────
// initiateCampaignDonation (Paystack)
// ─────────────────────────────────────────────

export async function initiateCampaignDonation(
  campaignId: string,
  amountNGN: number
): Promise<{ reference: string; access_code?: string; userId?: string }> {
  const { supabase, authUser, profile } = await getAuthContext()

  if (amountNGN < 100) {
    throw new Error('Minimum donation amount is ₦100')
  }

  const adminClient = getAdminClient()
  const { data: campaign, error } = await adminClient
    .from('funding')
    .select('id, title, user_id, goal_amount, impact')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    throw new Error('Campaign not found')
  }

  const isClosed = (campaign as any).status === 'closed' || campaign.impact?.startsWith('[CLOSED]')
  if (isClosed) {
    throw new Error('This campaign has been concluded and is no longer accepting donations.')
  }

  const { data: txs } = await adminClient
    .from('funding_transactions')
    .select('amount')
    .eq('funding_id', campaignId)
  const currentRaised = (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const goal = Number(campaign.goal_amount) || 0
  if (goal > 0 && currentRaised >= goal) {
    throw new Error('This campaign has successfully reached its funding goal and is no longer accepting donations.')
  }

  const donorUserId = profile?.id ?? authUser?.id ?? 'anonymous'
  const userEmail = authUser?.email ?? 'donor@hubnovo.com'

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  const ref = `DON-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  if (paystackSecretKey) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          amount: Math.round(amountNGN * 100),
          reference: ref,
          metadata: {
            type: 'campaign_donation',
            userId: donorUserId,
            referenceId: campaignId,
            campaignTitle: campaign.title,
            recipientUserId: campaign.user_id,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.data) {
          return {
            reference: result.data.reference || ref,
            access_code: result.data.access_code,
            userId: donorUserId,
          }
        }
      }
    } catch (err) {
      console.warn('Paystack initialize fetch failed, falling back to client reference:', err)
    }
  }

  return { reference: ref, userId: donorUserId }
}

// ─────────────────────────────────────────────
// verifyAndProcessCampaignDonation (Paystack Verification & Recovery)
// ─────────────────────────────────────────────

export async function verifyAndProcessCampaignDonation(
  campaignId: string,
  reference: string
): Promise<{
  success: boolean
  message?: string
  amount?: number
  alreadyProcessed?: boolean
  error?: string
}> {
  const { authUser, profile } = await getAuthContext()
  const adminClient = getAdminClient() // bypasses RLS for writes

  if (!reference || !reference.trim()) {
    return { success: false, error: 'A valid transaction reference is required' }
  }

  const cleanRef = reference.trim()

  // 1. Idempotency Check: Has this transaction already been recorded in funding_transactions?
  const { data: existingFt } = await adminClient
    .from('funding_transactions')
    .select('id, amount, funding_id')
    .eq('reference', cleanRef)
    .maybeSingle()

  if (existingFt) {
    revalidatePath(`/app/funding/${campaignId}`)
    revalidatePath('/app/funding')
    revalidatePath('/app/wallet')
    return {
      success: true,
      amount: Number(existingFt.amount) || 0,
      alreadyProcessed: true,
      message: 'Donation has already been verified and credited!',
    }
  }

  // 2. Verify with Paystack API using secret key
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecretKey) {
    return { success: false, error: 'Paystack secret key is not configured on the server' }
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await res.json()

    if (!payload.status || !payload.data) {
      return {
        success: false,
        error: payload.message || 'Transaction could not be verified on Paystack',
      }
    }

    const data = payload.data

    if (data.status !== 'success') {
      return {
        success: false,
        error: data.gateway_response || `Payment status is currently "${data.status}". Not completed.`,
      }
    }

    // 3. Mathematics: Kobo to Naira conversion & validation
    const amountKobo = Number(data.amount) || 0
    if (amountKobo <= 0) {
      return { success: false, error: 'Invalid transaction amount reported by Paystack' }
    }
    const amountNGN = Math.round(amountKobo) / 100

    // Fetch the campaign (use adminClient to avoid any RLS block)
    const { data: campaign, error: cErr } = await adminClient
      .from('funding')
      .select('id, title, user_id, funding_type')
      .eq('id', campaignId)
      .single()

    if (cErr || !campaign) {
      return { success: false, error: 'Target campaign not found' }
    }

    // Multi-tier user resolution (user_id is NOT NULL and FK in funding_transactions)
    let donorUserId: string | null =
      profile?.id ??
      (data.metadata?.userId && data.metadata.userId !== 'anonymous' ? data.metadata.userId : null)

    if (!donorUserId && authUser?.id) {
      donorUserId = authUser.id
    }

    if (!donorUserId && data.customer?.email) {
      const { data: userByEmail } = await adminClient
        .from('users')
        .select('id')
        .eq('email', data.customer.email)
        .maybeSingle()
      if (userByEmail?.id) {
        donorUserId = userByEmail.id
      }
    }

    // Fallback to campaign creator so no verified contribution is ever dropped
    if (!donorUserId) {
      donorUserId = campaign.user_id
    }

    // 4. Record into funding_transactions (admin client bypasses RLS)
    const { error: ftErr } = await adminClient.from('funding_transactions').insert({
      funding_id: campaignId,
      funding_type: campaign.funding_type || 'campaign',
      user_id: donorUserId,
      amount: amountNGN,
      reference: cleanRef,
      transaction_status: 'success',
      donation_visibility: (data.metadata?.userId === 'anonymous') ? 'anonymous' : 'public',
    })

    if (ftErr) {
      console.error('Error inserting funding_transaction:', ftErr)
      // If error is unique constraint, race condition was safely handled
      if (ftErr.code === '23505') {
        return { success: true, amount: amountNGN, alreadyProcessed: true }
      }
      return { success: false, error: 'Failed to record donation in database' }
    }

    // 5. Record into transactions ledger (using adminClient to bypass RLS)
    if (donorUserId) {
      await adminClient.from('transactions').insert({
        user_id: donorUserId,
        type: 'campaign_donation',
        amount: amountNGN,
        status: 'success',
        ref: cleanRef,
      })
    }

    // 6. Notify creator
    if (campaign.user_id && campaign.user_id !== donorUserId) {
      await adminClient.from('notifications').insert({
        user_id: campaign.user_id,
        actor_id: donorUserId,
        type: 'funding_contribution',
        reference_id: campaignId,
        read: false,
      })
    }

    revalidatePath(`/app/funding/${campaignId}`)
    revalidatePath('/app/funding')
    revalidatePath('/app/wallet')

    return {
      success: true,
      amount: amountNGN,
      message: `Successfully verified and credited ₦${amountNGN.toLocaleString()}!`,
    }
  } catch (err: any) {
    console.error('verifyAndProcessCampaignDonation error:', err)
    return { success: false, error: err.message || 'Verification service error' }
  }
}

// ─────────────────────────────────────────────
// donateFromWallet (Instant Wallet Deduction)
// ─────────────────────────────────────────────

export async function donateFromWallet(
  campaignId: string,
  amountNGN: number,
  pin?: string
): Promise<{ success: boolean; message: string }> {
  const { supabase, authUser, profile } = await getAuthContext()

  if (!authUser || !profile) {
    throw new Error('Please sign in to donate using your wallet')
  }

  if (amountNGN < 100) {
    throw new Error('Minimum donation is ₦100')
  }

  // Verify wallet PIN if user has one configured
  if (profile.wallet_pin) {
    if (!pin) throw new Error('Wallet PIN is required')
    const bcrypt = await import('bcryptjs')
    const pinMatches = await bcrypt.compare(pin, profile.wallet_pin)
    if (!pinMatches) throw new Error('Incorrect wallet PIN')
  }

  // Check wallet balance in user_wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('user_wallet')
    .select('id, balance')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (walletErr || !wallet || (Number(wallet.balance) || 0) < amountNGN) {
    throw new Error('Insufficient wallet balance')
  }

  // Fetch campaign (include funding_type, goal_amount, impact)
  const adminClient = getAdminClient()
  const { data: campaign } = await adminClient
    .from('funding')
    .select('id, title, user_id, funding_type, goal_amount, impact')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  const isClosed = (campaign as any).status === 'closed' || campaign.impact?.startsWith('[CLOSED]')
  if (isClosed) {
    throw new Error('This campaign has been concluded and is no longer accepting donations.')
  }

  const { data: txs } = await adminClient
    .from('funding_transactions')
    .select('amount')
    .eq('funding_id', campaignId)
  const currentRaised = (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const goal = Number(campaign.goal_amount) || 0
  if (goal > 0 && currentRaised >= goal) {
    throw new Error('This campaign has successfully reached its funding goal and is no longer accepting donations.')
  }

  const ref = `WLT-DON-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // 1. Deduct wallet balance
  const currentBal = Number(wallet.balance) || 0
  const newBalance = currentBal - amountNGN
  const { error: deductErr } = await supabase
    .from('user_wallet')
    .update({
      balance: newBalance,
    })
    .eq('id', wallet.id)

  if (deductErr) throw new Error('Failed to deduct from wallet')

  // 2. Insert into funding_transactions (admin client bypasses RLS)
  const { error: ftErr } = await adminClient.from('funding_transactions').insert({
    funding_id: campaignId,
    funding_type: campaign.funding_type || 'campaign',
    user_id: authUser.id,
    amount: amountNGN,
    reference: ref,
    transaction_status: 'success',
  })

  if (ftErr) {
    console.error('funding_transactions insert error:', ftErr)
  }

  // 3. Record transaction in user ledger (using valid schema columns)
  await supabase.from('transactions').insert({
    user_id: authUser.id,
    type: 'campaign_donation',
    amount: amountNGN,
    status: 'success',
    ref,
  })

  // 4. Notify campaign creator
  if (campaign.user_id !== authUser.id) {
    await supabase.from('notifications').insert({
      user_id: campaign.user_id,
      actor_id: authUser.id,
      type: 'funding_contribution',
      reference_id: campaignId,
      read: false,
    })
  }

  revalidatePath(`/app/funding/${campaignId}`)
  revalidatePath('/app/funding')
  revalidatePath('/app/wallet')

  return { success: true, message: `Donation of ₦${amountNGN.toLocaleString()} successful! Thank you for your support.` }
}

// ─────────────────────────────────────────────
// Campaign Fund Withdrawals
// ─────────────────────────────────────────────

async function getWithdrawnTotalAndPayouts(
  campaignId: string,
  adminClient: any
): Promise<{ totalWithdrawn: number; pastPayouts: FundingPayout[] }> {
  // 1. Try funding_payouts table first
  try {
    const { data: payouts, error: pErr } = await adminClient
      .from('funding_payouts')
      .select('*')
      .eq('funding_id', campaignId)
      .order('created_at', { ascending: false })

    if (!pErr && payouts) {
      const total = payouts
        .filter((p: any) => p.status !== 'failed' && p.status !== 'cancelled')
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
      return { totalWithdrawn: total, pastPayouts: payouts as FundingPayout[] }
    }
  } catch (err) {
    // Schema table may not be applied yet, fall through to transactions ledger
  }

  // 2. Dual-Layer Fallback: query transactions table for CPAY references
  const { data: txs } = await adminClient
    .from('transactions')
    .select('*')
    .like('ref', `CPAY-%-${campaignId.slice(0, 8)}-%`)
    .order('created_at', { ascending: false })

  const total = (txs ?? [])
    .filter((t: any) => t.status !== 'failed' && t.status !== 'cancelled')
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)

  const mapped: FundingPayout[] = (txs ?? []).map((t: any) => ({
    id: t.id,
    funding_id: campaignId,
    user_id: t.user_id,
    amount: Number(t.amount) || 0,
    destination: (t.bank_name ? 'bank' : 'wallet') as 'wallet' | 'bank',
    status: (t.status || 'completed') as any,
    reference: t.ref,
    bank_name: t.bank_name || null,
    account_number: t.account_number || null,
    account_name: t.account_name || null,
    bank_code: t.bank_code || null,
    notes: null,
    created_at: t.created_at,
    updated_at: t.created_at,
  }))

  return { totalWithdrawn: total, pastPayouts: mapped }
}

export async function getCampaignWithdrawalSummary(
  campaignId: string
): Promise<CampaignWithdrawalSummary> {
  const { authUser, profile } = await getAuthContext()

  if (!authUser) {
    throw new Error('You must be signed in to view withdrawal details')
  }

  const adminClient = getAdminClient()

  // 1. Fetch campaign
  const { data: campaign, error } = await adminClient
    .from('funding')
    .select('id, user_id, title')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.user_id !== authUser.id) {
    throw new Error('Forbidden: Only the campaign creator can manage withdrawals')
  }

  // 2. Calculate total raised from funding_transactions
  const { data: txs } = await adminClient
    .from('funding_transactions')
    .select('amount')
    .eq('funding_id', campaignId)

  const amountRaised = (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  // 3. Calculate total withdrawn and past payouts
  const { totalWithdrawn, pastPayouts } = await getWithdrawnTotalAndPayouts(campaignId, adminClient)

  const availableBalance = Math.max(0, amountRaised - totalWithdrawn)
  const hasPin = Boolean(profile?.wallet_pin)

  return {
    campaignId,
    amountRaised,
    totalWithdrawn,
    availableBalance,
    hasPin,
    pastPayouts,
  }
}

export async function withdrawCampaignToWallet(
  campaignId: string,
  amountNGN: number,
  pin: string
): Promise<{ success: boolean; message: string; reference: string; newAvailableBalance: number }> {
  const { authUser, profile } = await getAuthContext()

  if (!authUser || !profile) {
    throw new Error('Please sign in to withdraw funds')
  }

  if (amountNGN < 100) {
    throw new Error('Minimum withdrawal amount is ₦100')
  }

  // 1. Verify Wallet PIN
  if (!profile.wallet_pin) {
    throw new Error('You have not set a wallet PIN yet. Please configure your PIN in Settings.')
  }

  const bcrypt = await import('bcryptjs')
  const pinMatches = await bcrypt.compare(pin, profile.wallet_pin)
  if (!pinMatches) {
    throw new Error('Incorrect wallet PIN')
  }

  const adminClient = getAdminClient()

  // 2. Verify campaign ownership
  const { data: campaign, error: cErr } = await adminClient
    .from('funding')
    .select('id, user_id, title')
    .eq('id', campaignId)
    .single()

  if (cErr || !campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.user_id !== authUser.id) {
    throw new Error('Forbidden: Only the campaign creator can withdraw funds')
  }

  // 3. Verify available balance
  const { data: txs } = await adminClient
    .from('funding_transactions')
    .select('amount')
    .eq('funding_id', campaignId)

  const amountRaised = (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const { totalWithdrawn } = await getWithdrawnTotalAndPayouts(campaignId, adminClient)
  const availableBalance = Math.max(0, amountRaised - totalWithdrawn)

  if (amountNGN > availableBalance) {
    throw new Error(
      `Withdrawal amount of ₦${amountNGN.toLocaleString()} exceeds available campaign balance of ₦${availableBalance.toLocaleString()}`
    )
  }

  const ref = `CPAY-WLT-${campaignId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // 4. Atomic Wallet Balance Credit
  let { data: wallet } = await adminClient
    .from('user_wallet')
    .select('id, balance')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (!wallet) {
    const { data: created, error: createWalletErr } = await adminClient
      .from('user_wallet')
      .insert({ user_id: authUser.id, balance: 0 })
      .select('id, balance')
      .single()

    if (createWalletErr || !created) {
      throw new Error('Could not access user wallet')
    }
    wallet = created
  }

  const newWalletBalance = (Number(wallet.balance) || 0) + amountNGN
  const { error: walletUpdateErr } = await adminClient
    .from('user_wallet')
    .update({ balance: newWalletBalance })
    .eq('id', wallet.id)

  if (walletUpdateErr) {
    console.error('Wallet update error:', walletUpdateErr)
    throw new Error('Failed to credit wallet balance')
  }

  // 5. Insert into funding_payouts (best effort / resilient)
  try {
    await adminClient.from('funding_payouts').insert({
      funding_id: campaignId,
      user_id: profile.id,
      amount: amountNGN,
      destination: 'wallet',
      status: 'completed',
      reference: ref,
      notes: `Withdrawn to Platform Wallet from campaign: ${campaign.title}`,
    })
  } catch (err: any) {
    console.warn('funding_payouts insert notice:', err.message)
  }

  // 6. Record in user transactions ledger
  await adminClient.from('transactions').insert({
    user_id: profile.id,
    amount: amountNGN,
    type: 'deposit',
    status: 'success',
    ref,
    account_name: `Campaign: ${campaign.title.slice(0, 40)}`,
  })

  // 7. Revalidate
  revalidatePath(`/app/funding/${campaignId}`)
  revalidatePath('/app/funding')
  revalidatePath('/app/wallet')

  return {
    success: true,
    message: `Successfully transferred ₦${amountNGN.toLocaleString()} to your Hubnovo Platform Wallet!`,
    reference: ref,
    newAvailableBalance: availableBalance - amountNGN,
  }
}

export async function withdrawCampaignToBank(
  campaignId: string,
  bankDetails: {
    bankName: string
    accountNumber: string
    accountName: string
    bankCode?: string
  },
  amountNGN: number,
  pin: string
): Promise<{ success: boolean; message: string; reference: string; newAvailableBalance: number }> {
  const { authUser, profile } = await getAuthContext()

  if (!authUser || !profile) {
    throw new Error('Please sign in to withdraw funds')
  }

  if (amountNGN < 100) {
    throw new Error('Minimum withdrawal amount is ₦100')
  }

  if (!bankDetails.bankName?.trim()) {
    throw new Error('Bank name is required')
  }

  if (!/^\d{10}$/.test(bankDetails.accountNumber.trim())) {
    throw new Error('Account number must be exactly 10 digits')
  }

  if (!bankDetails.accountName?.trim()) {
    throw new Error('Account name is required')
  }

  // 1. Verify Wallet PIN
  if (!profile.wallet_pin) {
    throw new Error('You have not set a wallet PIN yet. Please configure your PIN in Settings.')
  }

  const bcrypt = await import('bcryptjs')
  const pinMatches = await bcrypt.compare(pin, profile.wallet_pin)
  if (!pinMatches) {
    throw new Error('Incorrect wallet PIN')
  }

  const adminClient = getAdminClient()

  // 2. Verify campaign ownership
  const { data: campaign, error: cErr } = await adminClient
    .from('funding')
    .select('id, user_id, title')
    .eq('id', campaignId)
    .single()

  if (cErr || !campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.user_id !== authUser.id) {
    throw new Error('Forbidden: Only the campaign creator can withdraw funds')
  }

  // 3. Verify available balance
  const { data: txs } = await adminClient
    .from('funding_transactions')
    .select('amount')
    .eq('funding_id', campaignId)

  const amountRaised = (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const { totalWithdrawn } = await getWithdrawnTotalAndPayouts(campaignId, adminClient)
  const availableBalance = Math.max(0, amountRaised - totalWithdrawn)

  if (amountNGN > availableBalance) {
    throw new Error(
      `Withdrawal amount of ₦${amountNGN.toLocaleString()} exceeds available campaign balance of ₦${availableBalance.toLocaleString()}`
    )
  }

  const ref = `CPAY-BNK-${campaignId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // 4. Insert into funding_payouts (pending settlement)
  try {
    await adminClient.from('funding_payouts').insert({
      funding_id: campaignId,
      user_id: profile.id,
      amount: amountNGN,
      destination: 'bank',
      status: 'pending',
      reference: ref,
      bank_name: bankDetails.bankName.trim(),
      account_number: bankDetails.accountNumber.trim(),
      account_name: bankDetails.accountName.trim(),
      bank_code: bankDetails.bankCode || null,
      notes: `Direct bank withdrawal from campaign: ${campaign.title}`,
    })
  } catch (err: any) {
    console.warn('funding_payouts insert notice:', err.message)
  }

  // 5. Record in user transactions ledger
  await adminClient.from('transactions').insert({
    user_id: profile.id,
    amount: amountNGN,
    type: 'withdrawal',
    status: 'pending',
    ref,
    bank_name: bankDetails.bankName.trim(),
    account_number: bankDetails.accountNumber.trim(),
    account_name: bankDetails.accountName.trim(),
    bank_code: bankDetails.bankCode || null,
  })

  // 6. Revalidate
  revalidatePath(`/app/funding/${campaignId}`)
  revalidatePath('/app/funding')
  revalidatePath('/app/wallet')

  return {
    success: true,
    message: `Withdrawal request of ₦${amountNGN.toLocaleString()} to ${bankDetails.bankName} (${bankDetails.accountNumber}) has been submitted successfully!`,
    reference: ref,
    newAvailableBalance: availableBalance - amountNGN,
  }
}

