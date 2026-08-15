'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CampaignWithCreator } from '@/lib/types'

const DEFAULT_LIMIT = 12

export type FundingFilter = 'all' | 'campaign' | 'project'
export type FundingSort = 'recent' | 'most_funded'

// ─────────────────────────────────────────────
// fetchCampaigns
// ─────────────────────────────────────────────

export async function fetchCampaigns(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT,
  filter: FundingFilter = 'all',
  sort: FundingSort = 'recent'
): Promise<{ campaigns: CampaignWithCreator[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { campaigns: [], nextCursor: null }
  }

  const sortColumn = sort === 'most_funded' ? 'amount_raised' : 'created_at'

  let query = supabase
    .from('funding')
    .select(
      `
      id,
      creator_id,
      type,
      title,
      description,
      cover_url,
      goal_amount,
      amount_raised,
      deadline,
      status,
      donor_count,
      created_at,
      updated_at,
      creator:users (
        username,
        avatar_url
      )
    `
    )
    .eq('status', 'active')
    .order(sortColumn, { ascending: false })
    .limit(limit + 1)

  if (filter !== 'all') {
    query = query.eq('type', filter)
  }

  if (cursor) {
    if (sort === 'most_funded') {
      query = query.lt('amount_raised', cursor)
    } else {
      query = query.lt('created_at', cursor)
    }
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('fetchCampaigns error:', error?.message ?? error)
    return { campaigns: [], nextCursor: null }
  }

  const hasMore = data.length > limit
  const pageData = hasMore ? data.slice(0, limit) : data

  const campaigns: CampaignWithCreator[] = pageData.map((row: any) => ({
    id: row.id,
    creator_id: row.creator_id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    cover_url: row.cover_url ?? null,
    goal_amount: row.goal_amount,
    amount_raised: row.amount_raised,
    deadline: row.deadline,
    status: row.status,
    donor_count: row.donor_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    creator: {
      username: row.creator?.username ?? '',
      avatar_url: row.creator?.avatar_url ?? null,
    },
  }))

  const lastItem = pageData[pageData.length - 1]
  const nextCursor = hasMore
    ? sort === 'most_funded'
      ? String(lastItem.amount_raised)
      : lastItem.created_at
    : null

  return { campaigns, nextCursor }
}

// ─────────────────────────────────────────────
// fetchCampaignById
// ─────────────────────────────────────────────

export async function fetchCampaignById(id: string): Promise<
  | (CampaignWithCreator & {
      creator_display_name: string
      creator_bio: string | null
      creator_profession: string | null
      creator_verified: boolean
    })
  | null
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data, error } = await supabase
    .from('funding')
    .select(
      `
      id,
      creator_id,
      type,
      title,
      description,
      cover_url,
      goal_amount,
      amount_raised,
      deadline,
      status,
      donor_count,
      created_at,
      updated_at,
      creator:users (
        username,
        display_name,
        avatar_url,
        bio,
        profession,
        verified
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('fetchCampaignById error:', error?.message ?? error)
    return null
  }

  const row = data as any

  return {
    id: row.id,
    creator_id: row.creator_id,
    type: row.type,
    title: row.title,
    description: row.description ?? null,
    cover_url: row.cover_url ?? null,
    goal_amount: row.goal_amount,
    amount_raised: row.amount_raised,
    deadline: row.deadline,
    status: row.status,
    donor_count: row.donor_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    creator: {
      username: row.creator?.username ?? '',
      avatar_url: row.creator?.avatar_url ?? null,
    },
    creator_display_name: row.creator?.display_name ?? '',
    creator_bio: row.creator?.bio ?? null,
    creator_profession: row.creator?.profession ?? null,
    creator_verified: row.creator?.verified ?? false,
  }
}

// ─────────────────────────────────────────────
// donateToCampaign
// ─────────────────────────────────────────────

export async function donateToCampaign(
  campaignId: string,
  amountNGN: number
): Promise<{ reference: string; access_code: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  if (amountNGN < 100) throw new Error('Minimum donation amount is ₦100')

  // Get user profile for email
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Verify campaign exists and is active
  const { data: campaign } = await supabase
    .from('funding')
    .select('id, title, status')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')
  if (campaign.status !== 'active') throw new Error('Campaign is no longer active')

  const amountKobo = Math.round(amountNGN * 100)
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey) throw new Error('Payment configuration error')

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      metadata: {
        type: 'campaign_donation',
        userId: profile.id,
        referenceId: campaignId,
        campaignTitle: campaign.title,
        custom_fields: [
          {
            display_name: 'Campaign',
            variable_name: 'campaign_title',
            value: campaign.title,
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Paystack init error:', err)
    throw new Error('Failed to initialise payment')
  }

  const result = await response.json()

  if (!result.status) {
    throw new Error(result.message ?? 'Payment initialisation failed')
  }

  return {
    reference: result.data.reference,
    access_code: result.data.access_code,
  }
}

// ─────────────────────────────────────────────
// CampaignFormData — shared input type
// ─────────────────────────────────────────────

export interface CampaignFormData {
  type: 'campaign' | 'project'
  title: string
  description: string
  goal_amount: number
  deadline: string // ISO date string YYYY-MM-DD
  cover_url: string | null
}

// ─────────────────────────────────────────────
// createCampaign
// ─────────────────────────────────────────────

export async function createCampaign(data: CampaignFormData): Promise<{ id: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  // Resolve the profile id (users.id) from auth_id
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  const { data: campaign, error: insertError } = await supabase
    .from('funding')
    .insert({
      creator_id: profile.id,
      type: data.type,
      title: data.title,
      description: data.description || null,
      cover_url: data.cover_url || null,
      goal_amount: data.goal_amount,
      deadline: data.deadline,
      status: 'active',
    })
    .select('id')
    .single()

  if (insertError || !campaign) {
    console.error('createCampaign error:', insertError)
    throw new Error('Failed to create campaign')
  }

  revalidatePath('/app/funding')

  return { id: campaign.id }
}

// ─────────────────────────────────────────────
// updateCampaign
// ─────────────────────────────────────────────

export async function updateCampaign(id: string, data: CampaignFormData): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  // Resolve profile id
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  // Verify ownership before updating
  const { data: existing, error: fetchError } = await supabase
    .from('funding')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) throw new Error('Campaign not found')

  if (existing.creator_id !== profile.id) {
    throw new Error('Forbidden: you are not the creator of this campaign')
  }

  const { error: updateError } = await supabase
    .from('funding')
    .update({
      type: data.type,
      title: data.title,
      description: data.description || null,
      cover_url: data.cover_url || null,
      goal_amount: data.goal_amount,
      deadline: data.deadline,
    })
    .eq('id', id)

  if (updateError) {
    console.error('updateCampaign error:', updateError)
    throw new Error('Failed to update campaign')
  }

  revalidatePath('/app/funding')
  revalidatePath(`/app/funding/${id}`)
}
