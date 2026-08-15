'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ServiceWithProvider, PricingTier } from '@/lib/types'

const DEFAULT_LIMIT = 12

export type ServiceCategory =
  | 'all'
  | 'Tech'
  | 'Design'
  | 'Writing'
  | 'Marketing'
  | 'Finance'
  | 'Health'
  | 'Education'
  | 'Legal'
  | 'Other'

// ─────────────────────────────────────────────
// fetchServices — cursor-based paginated catalogue
// ─────────────────────────────────────────────

export async function fetchServices(
  cursor: string | null,
  limit: number = DEFAULT_LIMIT,
  category?: string
): Promise<{ services: ServiceWithProvider[]; nextCursor: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { services: [], nextCursor: null }
  }

  let query = supabase
    .from('services')
    .select(
      `
      id,
      provider_id,
      title,
      description,
      category,
      cover_url,
      pricing_tiers,
      active,
      created_at,
      updated_at,
      provider:users!services_provider_id_fkey (
        display_name,
        avatar_url,
        username
      )
    `
    )
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('fetchServices error:', error)
    return { services: [], nextCursor: null }
  }

  const hasMore = data.length > limit
  const pageData = hasMore ? data.slice(0, limit) : data

  const services: ServiceWithProvider[] = pageData.map((row: any) => ({
    id: row.id,
    provider_id: row.provider_id,
    title: row.title,
    description: row.description ?? null,
    category: row.category,
    cover_url: row.cover_url ?? null,
    pricing_tiers: row.pricing_tiers ?? [],
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    provider: {
      display_name: row.provider?.display_name ?? '',
      avatar_url: row.provider?.avatar_url ?? null,
      username: row.provider?.username ?? '',
    },
  }))

  const lastItem = pageData[pageData.length - 1]
  const nextCursor = hasMore ? lastItem.created_at : null

  return { services, nextCursor }
}

// ─────────────────────────────────────────────
// fetchServiceById — full detail with extended provider info
// ─────────────────────────────────────────────

export async function fetchServiceById(id: string): Promise<
  | (ServiceWithProvider & {
      provider_bio: string | null
      provider_profession: string | null
      provider_verified: boolean
      provider_id: string
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
    .from('services')
    .select(
      `
      id,
      provider_id,
      title,
      description,
      category,
      cover_url,
      pricing_tiers,
      active,
      created_at,
      updated_at,
      provider:users!services_provider_id_fkey (
        display_name,
        avatar_url,
        username,
        bio,
        profession,
        verified
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('fetchServiceById error:', error)
    return null
  }

  const row = data as any

  return {
    id: row.id,
    provider_id: row.provider_id,
    title: row.title,
    description: row.description ?? null,
    category: row.category,
    cover_url: row.cover_url ?? null,
    pricing_tiers: row.pricing_tiers ?? [],
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    provider: {
      display_name: row.provider?.display_name ?? '',
      avatar_url: row.provider?.avatar_url ?? null,
      username: row.provider?.username ?? '',
    },
    provider_bio: row.provider?.bio ?? null,
    provider_profession: row.provider?.profession ?? null,
    provider_verified: row.provider?.verified ?? false,
  }
}

// ─────────────────────────────────────────────
// ServiceFormData — shared input type
// ─────────────────────────────────────────────

export interface ServiceFormData {
  title: string
  description: string
  category: string
  pricing_tiers: PricingTier[]
  cover_url: string | null
}

// ─────────────────────────────────────────────
// createService
// ─────────────────────────────────────────────

export async function createService(data: ServiceFormData): Promise<{ id: string }> {
  const supabase = await createClient()

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

  const { data: service, error: insertError } = await supabase
    .from('services')
    .insert({
      provider_id: profile.id,
      user_id: user.id,       // auth UUID — required by NOT NULL constraint + RLS
      title: data.title,
      description: data.description || null,
      category: data.category,
      cover_url: data.cover_url || null,
      pricing_tiers: data.pricing_tiers,
      active: true,
    })
    .select('id')
    .single()

  if (insertError || !service) {
    console.error('createService error:', insertError)
    throw new Error('Failed to create service listing')
  }

  revalidatePath('/app/services')

  return { id: service.id }
}

// ─────────────────────────────────────────────
// updateService — guard provider_id = current_user.id
// ─────────────────────────────────────────────

export async function updateService(id: string, data: ServiceFormData): Promise<void> {
  const supabase = await createClient()

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

  // Verify ownership before updating
  const { data: existing, error: fetchError } = await supabase
    .from('services')
    .select('provider_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) throw new Error('Service not found')

  if (existing.provider_id !== profile.id) {
    throw new Error('Forbidden: you are not the provider of this service')
  }

  const { error: updateError } = await supabase
    .from('services')
    .update({
      title: data.title,
      description: data.description || null,
      category: data.category,
      cover_url: data.cover_url || null,
      pricing_tiers: data.pricing_tiers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('updateService error:', updateError)
    throw new Error('Failed to update service listing')
  }

  revalidatePath('/app/services')
  revalidatePath(`/app/services/${id}`)
}

// ─────────────────────────────────────────────
// deleteService — sets active = false; guard provider_id = current_user.id
// ─────────────────────────────────────────────

export async function deleteService(id: string): Promise<void> {
  const supabase = await createClient()

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

  // Verify ownership before deleting
  const { data: existing, error: fetchError } = await supabase
    .from('services')
    .select('provider_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) throw new Error('Service not found')

  if (existing.provider_id !== profile.id) {
    throw new Error('Forbidden: you are not the provider of this service')
  }

  const { error: updateError } = await supabase
    .from('services')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('deleteService error:', updateError)
    throw new Error('Failed to delete service listing')
  }

  revalidatePath('/app/services')
}
