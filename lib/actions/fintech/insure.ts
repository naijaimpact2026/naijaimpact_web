'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsureProduct, Policy, Claim } from '@/lib/types'

// ─────────────────────────────────────────────
// fetchInsureProducts
// ─────────────────────────────────────────────

export async function fetchInsureProducts(): Promise<InsureProduct[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fintech_insure_products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('fetchInsureProducts error:', error)
    return []
  }

  // Normalise DB column names to type field names
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    category: row.category,
    coverage_amount: row.coverage_amount,
    premium_monthly: row.monthly_premium ?? row.premium_monthly,
    coverage_months: row.duration_months ?? row.coverage_months ?? 12,
    duration_months: row.duration_months,
    monthly_premium: row.monthly_premium,
    active: row.active,
    created_at: row.created_at,
  })) as InsureProduct[]
}

// ─────────────────────────────────────────────
// fetchUserPolicies
// ─────────────────────────────────────────────

export type PolicyWithProduct = Policy & {
  product_name: string
  product_category: string
  coverage_amount: number
}

export async function fetchUserPolicies(userId: string): Promise<PolicyWithProduct[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data, error } = await supabase
    .from('fintech_insure_policies')
    .select(
      `
      id,
      user_id,
      product_id,
      status,
      start_date,
      end_date,
      created_at,
      product:fintech_insure_products (
        name,
        category,
        coverage_amount
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('fetchUserPolicies error:', error)
    return []
  }

  return data.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    product_id: row.product_id,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.created_at,
    product_name: row.product?.name ?? 'Unknown',
    product_category: row.product?.category ?? '',
    coverage_amount: row.product?.coverage_amount ?? 0,
  })) as PolicyWithProduct[]
}

// ─────────────────────────────────────────────
// fetchUserClaims
// ─────────────────────────────────────────────

export type ClaimWithPolicy = Claim & {
  policy_product_name: string
}

export async function fetchUserClaims(userId: string): Promise<ClaimWithPolicy[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return []

  const { data, error } = await supabase
    .from('fintech_insure_claims')
    .select(
      `
      id,
      policy_id,
      user_id,
      description,
      document_urls,
      status,
      created_at,
      policy:fintech_insure_policies (
        product:fintech_insure_products (
          name
        )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('fetchUserClaims error:', error)
    return []
  }

  return data.map((row: any) => ({
    id: row.id,
    policy_id: row.policy_id,
    user_id: row.user_id,
    description: row.description,
    document_urls: row.document_urls ?? [],
    status: row.status,
    created_at: row.created_at,
    updated_at: row.created_at,
    policy_product_name: row.policy?.product?.name ?? 'Unknown Policy',
  })) as ClaimWithPolicy[]
}

// ─────────────────────────────────────────────
// purchasePolicy
// Returns Paystack initialization data for the client to open the popup.
// The actual policy row is created by the Paystack webhook on charge.success.
// ─────────────────────────────────────────────

export async function purchasePolicy(
  productId: string,
  amountNGN: number
): Promise<{ reference: string; access_code: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  // Resolve platform user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  // Verify product is active
  const { data: product } = await supabase
    .from('fintech_insure_products')
    .select('id, name, active')
    .eq('id', productId)
    .single()

  if (!product || !product.active) throw new Error('Insurance product not available')

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
        type: 'insurance_premium',
        userId: profile.id,
        referenceId: productId,
        productName: product.name,
        custom_fields: [
          {
            display_name: 'Product',
            variable_name: 'product_name',
            value: product.name,
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Paystack insurance init error:', err)
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
// fileClaim
// ─────────────────────────────────────────────

interface FileClaimInput {
  policy_id: string
  description: string
  document_urls: string[]
}

export async function fileClaim(
  input: FileClaimInput
): Promise<{ success: boolean; error?: string; claim?: Claim }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { success: false, error: 'Unauthenticated' }

  // Resolve platform user
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) return { success: false, error: 'User profile not found' }

  // Verify the policy belongs to this user
  const { data: policy, error: policyError } = await supabase
    .from('fintech_insure_policies')
    .select('id, status')
    .eq('id', input.policy_id)
    .eq('user_id', profile.id)
    .single()

  if (policyError || !policy) {
    return { success: false, error: 'Policy not found or does not belong to you' }
  }

  if (policy.status !== 'active') {
    return { success: false, error: 'Claims can only be filed against active policies' }
  }

  const { data: claim, error: insertError } = await supabase
    .from('fintech_insure_claims')
    .insert({
      policy_id: input.policy_id,
      user_id: profile.id,
      description: input.description.trim(),
      document_urls: input.document_urls,
      status: 'pending',
    })
    .select('*')
    .single()

  if (insertError || !claim) {
    console.error('fileClaim insert error:', insertError)
    return { success: false, error: 'Failed to submit claim. Please try again.' }
  }

  revalidatePath('/app/fintech/insure')

  return { success: true, claim: claim as Claim }
}
