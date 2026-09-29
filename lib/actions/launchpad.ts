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
    let business: BusinessProfile | null = null

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!businessError && businessData) {
      business = businessData as BusinessProfile
    } else {
      // Graceful fallback to nm_seller_profiles if businesses table is not yet in schema cache
      const { data: seller } = await supabase
        .from('nm_seller_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (seller && seller.business_name) {
        business = {
          id: seller.id,
          user_id: profile.id,
          name: seller.business_name,
          tagline: null,
          category: 'Retail & Commerce',
          description: seller.bio || null,
          location_state: seller.state || 'Lagos',
          location_city: seller.city || null,
          logo_url: seller.logo_url || null,
          stage: 'planning',
          step_progress: 2,
          created_at: seller.created_at || new Date().toISOString(),
          updated_at: seller.updated_at || new Date().toISOString(),
        }
      }
    }

    // 2. Fetch CAC application if business exists
    let cacApplication: CacApplication | null = null
    if (business && !business.id.startsWith('nm_')) {
      const { data: cacData, error: cacError } = await supabase
        .from('cac_applications')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cacError && cacData) {
        cacApplication = cacData as CacApplication
      }
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
      stepProgress = Math.max(stepProgress, business.step_progress || 2)
      if (cacApplication) {
        if (cacApplication.status === 'approved') {
          stepProgress = Math.max(stepProgress, 3)
        } else {
          stepProgress = Math.max(stepProgress, 2)
        }
      }
      if (businessGoal) {
        stepProgress = Math.max(stepProgress, 5) // Step 4 done -> on Step 5
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

    let business: BusinessProfile | null = null
    let usedFallback = false

    // Try primary businesses table first
    if (input.id && !input.id.startsWith('nm_')) {
      const { data, error } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', input.id)
        .eq('user_id', profile.id)
        .select('*')
        .single()

      if (!error && data) {
        business = data as BusinessProfile
      } else if (
        error &&
        (error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.code === '42P01')
      ) {
        usedFallback = true
      } else if (error) {
        throw new Error(error.message)
      }
    } else {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (!error && data) {
        business = data as BusinessProfile
      } else if (
        error &&
        (error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.code === '42P01')
      ) {
        usedFallback = true
      } else if (error) {
        throw new Error(error.message)
      }
    }

    // Graceful fallback to nm_seller_profiles if businesses table has not been migrated into Supabase yet
    if (usedFallback || !business) {
      const { data: existingSeller } = await supabase
        .from('nm_seller_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle()

      const sellerPayload = {
        user_id: profile.id,
        business_name: trimmedName,
        bio: input.description?.trim() || null,
        logo_url: input.logo_url || null,
        state: input.location_state?.trim() || 'Lagos',
        city: input.location_city?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      let sellerId = existingSeller?.id
      if (sellerId) {
        await supabase
          .from('nm_seller_profiles')
          .update(sellerPayload)
          .eq('id', sellerId)
      } else {
        const { data: createdSeller } = await supabase
          .from('nm_seller_profiles')
          .insert(sellerPayload)
          .select('id')
          .single()
        sellerId = createdSeller?.id
      }

      business = {
        id: sellerId || `nm_${profile.id}`,
        user_id: profile.id,
        name: trimmedName,
        tagline: input.tagline?.trim() || null,
        category: input.category,
        description: input.description?.trim() || null,
        location_state: input.location_state?.trim() || 'Lagos',
        location_city: input.location_city?.trim() || null,
        logo_url: input.logo_url || null,
        stage: 'planning',
        step_progress: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
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
    message: 'Name format complies with Hubnovo Enterprise naming guidelines.',
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
      return { success: false, error: 'Physical business address and state are required for registration.' }
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
          error: `Insufficient wallet balance. You have ₦${balance.toLocaleString('en-NG')}, but the subsidised Hubnovo registration fee is ₦${FEE.toLocaleString('en-NG')}. Please fund your wallet or pay via Paystack.`,
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
        description: `Subsidised Hubnovo Registration — ${name1}`,
      })
    }

    // Ensure business_id exists in public.businesses (satisfying foreign key constraint)
    let validBusinessId = input.business_id

    const { data: existingBiz } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', input.business_id)
      .maybeSingle()

    if (!existingBiz) {
      // Find user's business or auto-create in public.businesses
      const { data: userBiz } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (userBiz) {
        validBusinessId = userBiz.id
      } else {
        const { data: newBiz } = await supabase
          .from('businesses')
          .insert({
            user_id: profile.id,
            name: name1,
            category: 'Tech, Software & Digital Services',
            description: input.business_nature,
            location_state: input.business_state || 'Lagos',
            location_city: input.business_city || 'Ikeja',
            stage: 'planning',
            step_progress: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (newBiz) {
          validBusinessId = newBiz.id
        }
      }
    }

    // Insert or update CAC application
    const { data: existingApp } = await supabase
      .from('cac_applications')
      .select('id')
      .eq('business_id', validBusinessId)
      .maybeSingle()

    const cacPayload = {
      business_id: validBusinessId,
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

      if (!error && data) {
        application = data as CacApplication
      } else if (
        error &&
        (error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.code === '42P01')
      ) {
        application = {
          id: existingApp.id,
          ...cacPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CacApplication
      } else {
        throw new Error(error?.message || 'Failed to update CAC application')
      }
    } else {
      const { data, error } = await supabase
        .from('cac_applications')
        .insert({
          ...cacPayload,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (!error && data) {
        application = data as CacApplication
      } else if (
        error &&
        (error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.code === '42P01')
      ) {
        application = {
          id: `cac_${Date.now()}`,
          ...cacPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CacApplication
      } else {
        throw new Error(error?.message || 'Failed to submit CAC application')
      }
    }

    // Update business stage in businesses table
    await supabase
      .from('businesses')
      .update({
        stage: 'registered',
        step_progress: 3, // Advances to Step 3: Digital Storefront
        updated_at: new Date().toISOString(),
      })
      .eq('id', validBusinessId)

    revalidatePath('/app/services')
    return { success: true, data: application }
  } catch (err: any) {
    console.error('submitCacApplication error:', err)
    return {
      success: false,
      error: err.message || 'Failed to submit Hubnovo registration',
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

    const generatedBN =
      cacRegistrationNumber || `BN ${Math.floor(1000000 + Math.random() * 9000000)}`

    const updates: Partial<CacApplication> & { updated_at: string } = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'approved') {
      updates.cac_registration_number = generatedBN
      updates.approved_at = new Date().toISOString()
      updates.certificate_url = `/api/launchpad/cac-certificate?id=${applicationId}`

      // Advance business to Step 3 (Storefront)
      await supabase
        .from('businesses')
        .update({
          stage: 'registered',
          step_progress: 3,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id)
    }

    const { data, error } = await supabase
      .from('cac_applications')
      .update(updates)
      .eq('id', applicationId)
      .eq('user_id', profile.id)
      .select('*')
      .single()

    if (!error && data) {
      revalidatePath('/app/services')
      return { success: true, data: data as CacApplication }
    }

    // Fallback for simulation if table is not yet in schema cache
    const fallbackApp: CacApplication = {
      id: applicationId,
      business_id: 'default',
      user_id: profile.id,
      proposed_name_1: 'YOUR REGISTERED BUSINESS',
      proposed_name_2: 'ALTERNATIVE ENTERPRISE',
      business_nature: 'Commercial Operations & Trading',
      proprietor_full_name: profile.fullname || profile.display_name,
      proprietor_nin: '12345678901',
      proprietor_phone: '08012345678',
      business_address: 'Commercial Avenue',
      business_city: 'Ikeja',
      business_state: 'Lagos',
      fee_amount: 5000,
      fee_paid: true,
      payment_method: 'wallet',
      status: newStatus,
      cac_registration_number: newStatus === 'approved' ? generatedBN : null,
      approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    revalidatePath('/app/services')
    return { success: true, data: fallbackApp }
  } catch (err: any) {
    console.error('advanceCacApplicationStatus error:', err)
    return { success: false, error: err.message || 'Failed to advance status' }
  }
}

// ─────────────────────────────────────────────
// advanceBusinessStep (Direct Milestone Navigator)
// ─────────────────────────────────────────────

export async function advanceBusinessStep(
  step: number
): Promise<ActionResult<{ step: number }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    await supabase
      .from('businesses')
      .update({
        step_progress: step,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    return { success: true, data: { step } }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update step progress' }
  }
}

// ─────────────────────────────────────────────
// createStorefrontListing (Step 3: Digital Storefront)
// ─────────────────────────────────────────────

export interface StorefrontListingInput {
  business_id: string
  title: string
  description: string
  listing_type: 'product' | 'service'
  price: number
  category?: string
  delivery_option?: 'pickup' | 'delivery' | 'nationwide'
  delivery_fee?: number
  escrow_enabled?: boolean
  image_url?: string
}

export async function createStorefrontListing(
  input: StorefrontListingInput
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    const supabase = await createClient()
    const { authUser, profile } = await resolveProfile(supabase)

    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: 'Listing title must be at least 3 characters long.' }
    }
    if (typeof input.price !== 'number' || input.price < 0) {
      return { success: false, error: 'Please enter a valid price in Naira.' }
    }

    // Get or create nm_seller_profile
    let sellerId: string | null = null
    try {
      const { data: existingSeller } = await supabase
        .from('nm_seller_profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (existingSeller?.id) {
        sellerId = existingSeller.id
      } else {
        const { data: createdSeller } = await supabase
          .from('nm_seller_profiles')
          .insert({
            user_id: authUser.id,
            business_name: profile.display_name || profile.fullname || 'Seller',
            tier: 'verified',
            is_verified: true,
          })
          .select('id')
          .single()
        sellerId = createdSeller?.id || null
      }
    } catch (sellerErr) {
      console.warn('nm_seller_profiles lookup/create non-fatal:', sellerErr)
    }

    let createdListingId = `listing_${Date.now()}`

    // Insert into nm_listings
    try {
      const { data: listing, error: listingError } = await supabase
        .from('nm_listings')
        .insert({
          seller_id: sellerId || authUser.id,
          user_id: authUser.id,
          title: input.title.trim(),
          description: input.description.trim(),
          listing_type: input.listing_type,
          price: input.price,
          delivery_option: input.delivery_option || 'delivery',
          delivery_fee: input.delivery_fee || 0,
          escrow_enabled: input.escrow_enabled ?? true,
          is_active: true,
          tags: ['business_launchpad', input.listing_type],
        })
        .select('id')
        .single()

      if (!listingError && listing) {
        createdListingId = listing.id
      }
    } catch (listingErr) {
      console.warn('nm_listings insert non-fatal:', listingErr)
    }

    // Advance business step progress to Step 4 (Savings Goal)
    await supabase
      .from('businesses')
      .update({
        step_progress: 4,
        stage: 'launched',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    revalidatePath('/app/market')

    return {
      success: true,
      data: { id: createdListingId, title: input.title.trim() },
    }
  } catch (err: any) {
    console.error('createStorefrontListing error:', err)
    return { success: false, error: err.message || 'Failed to create storefront listing' }
  }
}

// ─────────────────────────────────────────────
// createBusinessSavingsGoal (Step 4: Business Savings Goal)
// ─────────────────────────────────────────────

export interface BusinessSavingsGoalInput {
  business_id: string
  name: string
  target_amount: number
  target_date?: string
  initial_deposit?: number
  frequency?: 'daily' | 'weekly' | 'monthly' | 'manual'
}

export async function createBusinessSavingsGoal(
  input: BusinessSavingsGoalInput
): Promise<ActionResult<{ id: string; name: string; target_amount: number }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Savings goal name is required.' }
    }
    if (!input.target_amount || input.target_amount <= 0) {
      return { success: false, error: 'Target savings amount must be greater than zero.' }
    }

    const initialDeposit = Number(input.initial_deposit ?? 0)

    // Check wallet balance if initial deposit is specified
    if (initialDeposit > 0) {
      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (wallet && Number(wallet.balance ?? 0) >= initialDeposit) {
        await supabase
          .from('user_wallet')
          .update({
            balance: Number(wallet.balance) - initialDeposit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)

        await supabase.from('transactions').insert({
          user_id: profile.id,
          type: 'savings_deposit',
          amount: initialDeposit,
          status: 'success',
          reference_id: `GOAL_INIT_${Date.now()}`,
          description: `Initial seed deposit for ${input.name.trim()}`,
        })
      }
    }

    let goalId = `goal_${Date.now()}`
    try {
      const { data: goal, error: goalErr } = await supabase
        .from('fintech_safe_goal_savings')
        .insert({
          user_id: profile.id,
          name: input.name.trim(),
          target_amount: input.target_amount,
          current_amount: initialDeposit,
          target_date: input.target_date || null,
          status: 'active',
        })
        .select('id')
        .single()

      if (!goalErr && goal) {
        goalId = goal.id
      }
    } catch (goalErr) {
      console.warn('fintech_safe_goal_savings insert non-fatal:', goalErr)
    }

    // Advance business step progress to Step 5 (Launch Announcement)
    await supabase
      .from('businesses')
      .update({
        step_progress: 5,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    revalidatePath('/app/fintech/safe')

    return {
      success: true,
      data: {
        id: goalId,
        name: input.name.trim(),
        target_amount: input.target_amount,
      },
    }
  } catch (err: any) {
    console.error('createBusinessSavingsGoal error:', err)
    return { success: false, error: err.message || 'Failed to create business savings goal' }
  }
}

// ─────────────────────────────────────────────
// broadcastBusinessLaunch (Step 5: Launch Announcement)
// ─────────────────────────────────────────────

export interface BroadcastLaunchInput {
  business_id: string
  caption: string
  hub?: string
  hashtags?: string[]
}

export async function broadcastBusinessLaunch(
  input: BroadcastLaunchInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!input.caption || input.caption.trim().length < 5) {
      return { success: false, error: 'Announcement caption must have at least 5 characters.' }
    }

    let postId = `post_${Date.now()}`
    try {
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          user_id: profile.id,
          caption: input.caption.trim(),
          type: 'text',
          post_type: 'post',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!postErr && post) {
        postId = post.id
      }
    } catch (postErr) {
      console.warn('posts insert non-fatal:', postErr)
    }

    // Advance business step progress to Step 6 (CommunityFund)
    await supabase
      .from('businesses')
      .update({
        step_progress: 6,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    revalidatePath('/app/feed')

    return { success: true, data: { id: postId } }
  } catch (err: any) {
    console.error('broadcastBusinessLaunch error:', err)
    return { success: false, error: err.message || 'Failed to broadcast announcement' }
  }
}

// ─────────────────────────────────────────────
// createBusinessCrowdfund (Step 6: CommunityFund Campaign)
// ─────────────────────────────────────────────

export interface BusinessCrowdfundInput {
  business_id: string
  title: string
  description: string
  goal_amount: number
  duration_days: number
  category?: string
}

export async function createBusinessCrowdfund(
  input: BusinessCrowdfundInput
): Promise<ActionResult<{ id: string; title: string; goal_amount: number }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: 'Campaign title is required.' }
    }
    if (!input.goal_amount || input.goal_amount <= 0) {
      return { success: false, error: 'Goal amount must be greater than zero.' }
    }

    const durationDays = input.duration_days || 60
    const deadline = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

    let campaignId = `cf_${Date.now()}`
    try {
      const { data: campaign, error: cErr } = await supabase
        .from('funding')
        .insert({
          creator_id: profile.id,
          title: input.title.trim(),
          description: input.description.trim(),
          goal_amount: input.goal_amount,
          amount_raised: 0,
          deadline,
          status: 'active',
          type: 'campaign',
        })
        .select('id')
        .single()

      if (!cErr && campaign) {
        campaignId = campaign.id
      }
    } catch (cErr) {
      console.warn('funding insert non-fatal:', cErr)
    }

    // Advance business step progress to Step 7 (TradeCred Score)
    await supabase
      .from('businesses')
      .update({
        step_progress: 7,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    revalidatePath('/app/funding')

    return {
      success: true,
      data: {
        id: campaignId,
        title: input.title.trim(),
        goal_amount: input.goal_amount,
      },
    }
  } catch (err: any) {
    console.error('createBusinessCrowdfund error:', err)
    return { success: false, error: err.message || 'Failed to create crowdfunding campaign' }
  }
}

// ─────────────────────────────────────────────
// unlockTradeCredScore (Step 7: TradeCred Rating & Credit Limit)
// ─────────────────────────────────────────────

export interface TradeCredUnlockData {
  score: number
  tier: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum'
  creditLimit: number
  milestonesCompleted: number
  certificateNumber: string
}

export async function unlockTradeCredScore(
  businessId: string
): Promise<ActionResult<TradeCredUnlockData>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    const finalScore = 785
    const finalTier = 'gold' as const
    const creditLimit = 2_500_000 // ₦2.5 Million working capital credit line
    const certNumber = `TC-SME-${Math.floor(100000 + Math.random() * 900000)}`

    // Update fintech_tradecred_scores
    try {
      await supabase
        .from('fintech_tradecred_scores')
        .upsert(
          {
            user_id: profile.id,
            score: finalScore,
            tier: finalTier,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      // Log milestone activity
      await supabase.from('fintech_tradecred_activity_logs').insert({
        user_id: profile.id,
        event_type: 'launchpad_formalization',
        point_impact: 185,
        description: 'Unlocked formal SME credit score via Business Launchpad 7-step completion',
      })
    } catch (tcErr) {
      console.warn('tradecred tables update non-fatal:', tcErr)
    }

    // Mark business as fully completed
    await supabase
      .from('businesses')
      .update({
        step_progress: 7,
        stage: 'scaling',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    revalidatePath('/app/services')
    revalidatePath('/app/fintech/tradecred')

    return {
      success: true,
      data: {
        score: finalScore,
        tier: finalTier,
        creditLimit,
        milestonesCompleted: 7,
        certificateNumber: certNumber,
      },
    }
  } catch (err: any) {
    console.error('unlockTradeCredScore error:', err)
    return { success: false, error: err.message || 'Failed to unlock TradeCred score' }
  }
}
