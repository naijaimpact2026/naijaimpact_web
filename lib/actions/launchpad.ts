'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  BusinessProfile,
  CacApplication,
  CacApplicationStatus,
  SafeGoalSavings,
} from '@/lib/types'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── Restricted Words by Nigerian CAMA / CAC Regulation ───────────────────────
const RESTRICTED_CAC_WORDS = [
  'federal',
  'national',
  'government',
  'state',
  'municipal',
  'chartered',
  'police',
  'military',
  'army',
  'navy',
  'airforce',
  'customs',
  'immigration',
  'bank',
  'cooperative',
  'holding',
]

/** Resolve the platform users.id from the auth session. */
async function resolveProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  // 1. Try lookup by auth_id
  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, fullname, username, email')
    .eq('auth_id', user.id)
    .maybeSingle()

  // 2. Fallback to primary key id = user.id
  if (!profile) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('users')
      .select('id, display_name, fullname, username, email')
      .eq('id', user.id)
      .maybeSingle()

    if (fallback) {
      profile = fallback
    } else if (profileError || fallbackError) {
      console.warn('resolveProfile lookup warning:', profileError?.message || fallbackError?.message)
    }
  }

  // 3. Fallback auto-provision if row doesn't exist
  if (!profile) {
    const fallbackName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.display_name as string) ||
      user.email?.split('@')[0] ||
      'Entrepreneur'

    const { data: provisioned, error: provError } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          auth_id: user.id,
          email: user.email || '',
          fullname: fallbackName,
          display_name: fallbackName,
          username:
            (user.email?.split('@')[0] || 'user').toLowerCase() +
            '_' +
            Math.floor(1000 + Math.random() * 9000),
          onboarded: true,
        },
        { onConflict: 'id' }
      )
      .select('id, display_name, fullname, username, email')
      .single()

    if (provisioned) {
      profile = provisioned
    } else {
      console.error('resolveProfile auto-provision error:', provError)
      throw new Error('User profile not found. Please refresh or sign in again.')
    }
  }

  return { authUser: user, profile }
}

// ─────────────────────────────────────────────
// getLaunchpadUserData
// ─────────────────────────────────────────────

export interface LaunchpadUserData {
  business: BusinessProfile | null
  cacApplication: CacApplication | null
  walletBalance: number
  businessGoal: SafeGoalSavings | null
  stepProgress: number
}

export async function getLaunchpadUserData(): Promise<ActionResult<LaunchpadUserData>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    // 1. Fetch user's primary business profile
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (businessError && businessError.code !== 'PGRST116') {
      console.warn('getLaunchpadUserData business error:', businessError.message)
    }

    const business = (businessData as BusinessProfile | null) ?? null

    // 2. Fetch CAC application if business exists
    let cacApplication: CacApplication | null = null
    if (business) {
      const { data: cacData, error: cacError } = await supabase
        .from('cac_applications')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cacError && cacError.code !== 'PGRST116') {
        console.warn('getLaunchpadUserData cac error:', cacError.message)
      }
      cacApplication = (cacData as CacApplication | null) ?? null
    }

    // 3. Fetch user wallet balance
    const { data: walletData } = await supabase
      .from('user_wallet')
      .select('balance')
      .eq('user_id', profile.id)
      .maybeSingle()

    const walletBalance = Number(walletData?.balance ?? 0)

    // 4. Fetch business savings goal if any
    const { data: goalData } = await supabase
      .from('fintech_safe_goal_savings')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    const goals = (goalData ?? []) as SafeGoalSavings[]
    const businessGoal =
      goals.find((g) => /business|seed|launchpad|equip/i.test(g.name)) ??
      goals[0] ??
      null

    // 5. Determine active step progress (1 through 7)
    let stepProgress = 1
    if (business) {
      stepProgress = 2
      if (cacApplication) {
        if (cacApplication.status === 'approved') {
          stepProgress = Math.max(stepProgress, 3)
        } else {
          stepProgress = 2
        }
      }
      if (businessGoal) {
        stepProgress = Math.max(stepProgress, 4)
      }
    }

    return {
      success: true,
      data: {
        business,
        cacApplication,
        walletBalance,
        businessGoal,
        stepProgress,
      },
    }
  } catch (err: any) {
    console.error('getLaunchpadUserData error:', err)
    return {
      success: false,
      error: err.message || 'Failed to fetch business launchpad data',
    }
  }
}

// ─────────────────────────────────────────────
// saveBusinessProfile (Step 1)
// ─────────────────────────────────────────────

export interface SaveBusinessInput {
  id?: string
  name: string
  tagline?: string
  category: string
  description?: string
  location_state?: string
  location_city?: string
  logo_url?: string
}

export async function saveBusinessProfile(
  input: SaveBusinessInput
): Promise<ActionResult<BusinessProfile>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    const trimmedName = input.name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Business name must be at least 2 characters long.' }
    }

    if (!input.category || input.category.trim() === '') {
      return { success: false, error: 'Please select a business category.' }
    }

    const payload = {
      user_id: profile.id,
      name: trimmedName,
      tagline: input.tagline?.trim() || null,
      category: input.category,
      description: input.description?.trim() || null,
      location_state: input.location_state?.trim() || 'Lagos',
      location_city: input.location_city?.trim() || null,
      logo_url: input.logo_url || null,
      stage: 'planning' as const,
      step_progress: 2, // Moves to Step 2: CAC Registration
      updated_at: new Date().toISOString(),
    }

    let business: BusinessProfile

    if (input.id) {
      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', input.id)
        .eq('user_id', profile.id)
        .select('*')
        .single()

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update business profile')
      }
      business = data as BusinessProfile
    } else {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create business profile')
      }
      business = data as BusinessProfile
    }

    revalidatePath('/app/services')
    return { success: true, data: business }
  } catch (err: any) {
    console.error('saveBusinessProfile error:', err)
    return {
      success: false,
      error: err.message || 'Failed to save business profile',
    }
  }
}

// ─────────────────────────────────────────────
// checkCacNameAvailability
// ─────────────────────────────────────────────

export interface NameCheckResult {
  available: boolean
  message: string
  hasRestrictedWords: boolean
  restrictedWord?: string
}

export async function checkCacNameAvailability(name: string): Promise<NameCheckResult> {
  const clean = name.trim().toLowerCase()
  if (!clean || clean.length < 3) {
    return {
      available: false,
      message: 'Business name must have at least 3 characters',
      hasRestrictedWords: false,
    }
  }

  // Check CAMA restricted words
  for (const word of RESTRICTED_CAC_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    if (regex.test(clean)) {
      return {
        available: false,
        hasRestrictedWords: true,
        restrictedWord: word.toUpperCase(),
        message: `The word "${word.toUpperCase()}" is restricted under Nigerian CAMA without special Ministerial consent. Consider an alternative or distinct name.`,
      }
    }
  }

  return {
    available: true,
    hasRestrictedWords: false,
    message: 'Name format complies with CAC Business Name naming guidelines.',
  }
}

// ─────────────────────────────────────────────
// submitCacApplication (Step 2)
// ─────────────────────────────────────────────

export interface SubmitCacInput {
  business_id: string
  proposed_name_1: string
  proposed_name_2: string
  business_nature: string
  proprietor_full_name: string
  proprietor_nin: string
  proprietor_phone: string
  business_address: string
  business_city: string
  business_state: string
  payment_method: 'wallet' | 'paystack'
  payment_reference?: string
}

export async function submitCacApplication(
  input: SubmitCacInput
): Promise<ActionResult<CacApplication>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    // Validations
    const name1 = input.proposed_name_1.trim()
    const name2 = input.proposed_name_2.trim()
    if (!name1 || !name2) {
      return { success: false, error: 'Both primary and alternative proposed business names are required.' }
    }

    const nin = input.proprietor_nin.trim().replace(/\D/g, '')
    if (nin.length !== 11) {
      return { success: false, error: 'National Identification Number (NIN) must be exactly 11 digits.' }
    }

    if (!input.business_nature.trim()) {
      return { success: false, error: 'Please describe the nature and operations of the business.' }
    }

    if (!input.proprietor_full_name.trim()) {
      return { success: false, error: 'Proprietor full legal name is required.' }
    }

    if (!input.business_address.trim() || !input.business_state.trim()) {
      return { success: false, error: 'Physical business address and state are required by CAC.' }
    }

    const FEE = 5000 // Subsidised fee: ₦5,000

    // Handle payment
    let paymentRef = input.payment_reference || `CAC_${Date.now()}`
    if (input.payment_method === 'wallet') {
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (walletError || !wallet) {
        return { success: false, error: 'Could not access user wallet.' }
      }

      const balance = Number(wallet.balance ?? 0)
      if (balance < FEE) {
        return {
          success: false,
          error: `Insufficient wallet balance. You have ₦${balance.toLocaleString('en-NG')}, but the subsidised CAC registration fee is ₦${FEE.toLocaleString('en-NG')}. Please fund your wallet or pay via Paystack.`,
        }
      }

      // Debit wallet balance
      const { error: debitError } = await supabase
        .from('user_wallet')
        .update({
          balance: balance - FEE,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      if (debitError) {
        throw new Error('Failed to deduct registration fee from wallet.')
      }

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'cac_registration',
        amount: FEE,
        status: 'success',
        reference_id: paymentRef,
        description: `Subsidised CAC Registration — ${name1}`,
      })
    }

    // Insert or update CAC application
    const { data: existingApp } = await supabase
      .from('cac_applications')
      .select('id')
      .eq('business_id', input.business_id)
      .maybeSingle()

    const cacPayload = {
      business_id: input.business_id,
      user_id: profile.id,
      proposed_name_1: name1,
      proposed_name_2: name2,
      business_nature: input.business_nature.trim(),
      proprietor_full_name: input.proprietor_full_name.trim(),
      proprietor_nin: nin,
      proprietor_phone: input.proprietor_phone.trim(),
      business_address: input.business_address.trim(),
      business_city: input.business_city.trim() || 'Lagos',
      business_state: input.business_state.trim(),
      fee_amount: FEE,
      fee_paid: true,
      payment_method: input.payment_method,
      payment_reference: paymentRef,
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let application: CacApplication
    if (existingApp?.id) {
      const { data, error } = await supabase
        .from('cac_applications')
        .update(cacPayload)
        .eq('id', existingApp.id)
        .select('*')
        .single()

      if (error || !data) throw new Error(error?.message || 'Failed to update CAC application')
      application = data as CacApplication
    } else {
      const { data, error } = await supabase
        .from('cac_applications')
        .insert({
          ...cacPayload,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error || !data) throw new Error(error?.message || 'Failed to submit CAC application')
      application = data as CacApplication
    }

    // Update business stage
    await supabase
      .from('businesses')
      .update({
        stage: 'registered',
        step_progress: 3, // Advances to Step 3: Digital Storefront
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.business_id)

    revalidatePath('/app/services')
    return { success: true, data: application }
  } catch (err: any) {
    console.error('submitCacApplication error:', err)
    return {
      success: false,
      error: err.message || 'Failed to submit CAC application',
    }
  }
}

// ─────────────────────────────────────────────
// advanceCacApplicationStatus (Simulation / Admin)
// ─────────────────────────────────────────────

export async function advanceCacApplicationStatus(
  applicationId: string,
  newStatus: CacApplicationStatus,
  cacRegistrationNumber?: string
): Promise<ActionResult<CacApplication>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    const updates: Partial<CacApplication> & { updated_at: string } = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'approved') {
      const generatedBN =
        cacRegistrationNumber || `BN ${Math.floor(1000000 + Math.random() * 9000000)}`
      updates.cac_registration_number = generatedBN
      updates.approved_at = new Date().toISOString()
      // Sample mock certificate PDF download path
      updates.certificate_url = `/api/launchpad/cac-certificate?id=${applicationId}`
    }

    const { data, error } = await supabase
      .from('cac_applications')
      .update(updates)
      .eq('id', applicationId)
      .eq('user_id', profile.id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update status')
    }

    revalidatePath('/app/services')
    return { success: true, data: data as CacApplication }
  } catch (err: any) {
    console.error('advanceCacApplicationStatus error:', err)
    return { success: false, error: err.message || 'Failed to advance status' }
  }
}
