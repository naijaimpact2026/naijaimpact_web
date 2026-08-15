'use server'

// ============================================================
// lib/actions/marketplace.ts
// Uses the REAL nm_* Supabase schema from the mobile app.
// Tables: nm_seller_profiles, nm_listings, nm_listing_images,
//         nm_orders, nm_escrow, nm_bookings, nm_reviews,
//         nm_saved_listings, nm_listing_detail_view
//         services_categories (for category list)
// ============================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  NmListing, NmListingDetail, NmSellerProfile,
  NmOrder, NmEscrow, NmBooking, NmReview,
  NmListingType, NmListingCondition, NmDeliveryOption,
} from '@/lib/types'

const PAGE_SIZE = 24

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  return { supabase, authUser: user }
}

/** Get or create nm_seller_profile for current auth user */
async function getOrCreateSellerProfile(supabase: any, authUserId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('nm_seller_profiles')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle()
  if (existing) return existing.id

  // Get user's name from users table for business_name default
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, fullname')
    .eq('auth_id', authUserId)
    .maybeSingle()

  const name = profile?.display_name ?? profile?.fullname ?? 'Seller'
  const { data: created, error } = await supabase
    .from('nm_seller_profiles')
    .insert({ user_id: authUserId, business_name: name })
    .select('id')
    .single()
  if (error || !created) throw new Error('Failed to create seller profile')
  return created.id
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES — from services_categories table
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchMarketCategories(): Promise<{ id: string; name: string; service_type: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services_categories')
    .select('id, name, service_type')
    .order('name', { ascending: true })
  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS — using nm_listing_detail_view for rich data
// ─────────────────────────────────────────────────────────────────────────────

export interface ListingFilters {
  category_id?: string
  listing_type?: NmListingType
  condition?: NmListingCondition
  min_price?: number
  max_price?: number
  state?: string
  negotiable?: boolean
  search?: string
  cursor?: string
}

export async function fetchListings(
  filters: ListingFilters = {},
  limit = PAGE_SIZE
): Promise<{ listings: NmListingDetail[]; nextCursor: string | null }> {
  const supabase = await createClient()

  // Query nm_listings directly with seller + images join.
  // Avoids nm_listing_detail_view auth.uid() dependency in server context.
  let query = supabase
    .from('nm_listings')
    .select(`
      *,
      seller_profile:nm_seller_profiles!nm_listings_seller_id_fkey(
        id, business_name, logo_url, tier, is_verified, tradecred_score, rating, user_id
      ),
      listing_images:nm_listing_images(image_url, sort_order),
      category:services_categories(id, name, service_type)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.listing_type) query = query.eq('listing_type', filters.listing_type)
  if (filters.condition) query = query.eq('condition', filters.condition)
  if (filters.min_price != null) query = query.gte('price', filters.min_price)
  if (filters.max_price != null) query = query.lte('price', filters.max_price)
  if (filters.state) query = query.eq('state', filters.state)
  if (filters.negotiable != null) query = query.eq('negotiable', filters.negotiable)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.cursor) query = query.lt('created_at', filters.cursor)

  const { data, error } = await query
  if (error) {
    console.error('fetchListings error:', error)
    return { listings: [], nextCursor: null }
  }
  if (!data) return { listings: [], nextCursor: null }

  const hasMore = data.length > limit
  const page = hasMore ? data.slice(0, limit) : data

  const listings: NmListingDetail[] = page.map((row: any) => {
    const images: string[] = (row.listing_images ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((i: any) => i.image_url)
    const cover = images[0] ?? null
    const sp = row.seller_profile ?? {}

    return {
      ...row,
      // Flatten seller_profile fields to match view columns
      seller_business_name: sp.business_name ?? null,
      seller_tier: sp.tier ?? 'free',
      seller_is_verified: sp.is_verified ?? false,
      seller_tradecred_score: sp.tradecred_score ?? 0,
      seller_rating: sp.rating ?? 0,
      seller_fullname: null,
      seller_profile_image_url: sp.logo_url ?? null,
      seller_username: null,
      // Category
      category_name: row.category?.name ?? null,
      category_type: row.category?.service_type ?? null,
      // Images
      cover_image_url: cover,
      image_urls: images,
      is_saved: false,
      // Clean up joined objects
      seller_profile: undefined,
      listing_images: undefined,
      category: undefined,
    } as NmListingDetail
  })

  return {
    listings,
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  }
}

export async function fetchListingById(id: string): Promise<NmListingDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nm_listings')
    .select(`
      *,
      seller_profile:nm_seller_profiles!nm_listings_seller_id_fkey(
        id, business_name, bio, logo_url, tier, is_verified, tradecred_score, rating, total_sales, user_id, phone
      ),
      listing_images:nm_listing_images(image_url, sort_order),
      category:services_categories(id, name, service_type)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const row = data as any
  const images: string[] = (row.listing_images ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((i: any) => i.image_url)
  const sp = row.seller_profile ?? {}

  // Increment views (fire-and-forget)
  supabase.from('nm_listings')
    .update({ views_count: (row.views_count ?? 0) + 1 })
    .eq('id', id)
    .then(() => {})

  return {
    ...row,
    seller_business_name: sp.business_name ?? null,
    seller_tier: sp.tier ?? 'free',
    seller_is_verified: sp.is_verified ?? false,
    seller_tradecred_score: sp.tradecred_score ?? 0,
    seller_rating: sp.rating ?? 0,
    seller_fullname: null,
    seller_profile_image_url: sp.logo_url ?? null,
    seller_username: null,
    category_name: row.category?.name ?? null,
    category_type: row.category?.service_type ?? null,
    cover_image_url: images[0] ?? null,
    image_urls: images,
    is_saved: false,
    seller_profile: undefined,
    listing_images: undefined,
    category: undefined,
  } as NmListingDetail
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE / UPDATE / DELETE LISTING
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateListingData {
  title: string
  description: string
  listing_type: NmListingType
  condition?: NmListingCondition
  category_id?: string
  price: number
  negotiable?: boolean
  stock?: number
  state?: string
  lga?: string
  city?: string
  delivery_option: NmDeliveryOption
  delivery_fee?: number
  brand?: string
  warranty_days?: number
  tags?: string[]
  images: string[]          // Cloudinary URLs — stored in nm_listing_images
  escrow_enabled?: boolean
}

export async function createListing(data: CreateListingData): Promise<{ id: string }> {
  const { supabase, authUser } = await requireAuth()
  const sellerId = await getOrCreateSellerProfile(supabase, authUser.id)

  const { data: listing, error } = await supabase
    .from('nm_listings')
    .insert({
      seller_id: sellerId,
      user_id: authUser.id,
      title: data.title,
      description: data.description,
      listing_type: data.listing_type,
      condition: data.condition ?? null,
      category_id: data.category_id ?? null,
      price: data.price,
      negotiable: data.negotiable ?? false,
      stock: data.stock ?? 1,
      state: data.state ?? null,
      lga: data.lga ?? null,
      city: data.city ?? null,
      delivery_option: data.delivery_option,
      delivery_fee: data.delivery_fee ?? 0,
      brand: data.brand ?? null,
      warranty_days: data.warranty_days ?? 0,
      tags: data.tags ?? [],
      escrow_enabled: data.escrow_enabled ?? true,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !listing) {
    console.error('createListing error:', error)
    throw new Error('Failed to create listing')
  }

  // Insert images into nm_listing_images
  if (data.images.length > 0) {
    const imgRows = data.images.map((url, i) => ({
      listing_id: listing.id,
      image_url: url,
      sort_order: i,
    }))
    await supabase.from('nm_listing_images').insert(imgRows)
  }

  revalidatePath('/app/market')
  return { id: listing.id }
}

export async function updateListing(
  id: string,
  data: Partial<Omit<CreateListingData, 'images'>> & { images?: string[] }
): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  // Verify ownership
  const { data: existing } = await supabase
    .from('nm_listings').select('user_id').eq('id', id).single()
  if (!existing || existing.user_id !== authUser.id) throw new Error('Forbidden')

  const { images, ...rest } = data
  const { error } = await supabase
    .from('nm_listings')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Failed to update listing')

  // Re-sync images if provided
  if (images) {
    await supabase.from('nm_listing_images').delete().eq('listing_id', id)
    if (images.length > 0) {
      await supabase.from('nm_listing_images').insert(
        images.map((url, i) => ({ listing_id: id, image_url: url, sort_order: i }))
      )
    }
  }

  revalidatePath('/app/market')
  revalidatePath(`/app/market/${id}`)
}

export async function deleteListing(id: string): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  const { data: existing } = await supabase
    .from('nm_listings').select('user_id').eq('id', id).single()
  if (!existing || existing.user_id !== authUser.id) throw new Error('Forbidden')

  await supabase.from('nm_listings')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/app/market')
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchSellerProfile(userId: string): Promise<NmSellerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('nm_seller_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data as NmSellerProfile | null
}

export async function fetchMySellerProfile(): Promise<NmSellerProfile | null> {
  const { supabase, authUser } = await requireAuth()
  const { data } = await supabase
    .from('nm_seller_profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()
  return data as NmSellerProfile | null
}

export async function upsertSellerProfile(updates: {
  business_name?: string
  bio?: string
  logo_url?: string
  state?: string
  lga?: string
  city?: string
  phone?: string
}): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  const { data: existing } = await supabase
    .from('nm_seller_profiles').select('id').eq('user_id', authUser.id).maybeSingle()

  if (existing) {
    await supabase.from('nm_seller_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', authUser.id)
  } else {
    await supabase.from('nm_seller_profiles')
      .insert({ user_id: authUser.id, ...updates })
  }
  revalidatePath('/app/market')
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS — using nm_orders + nm_escrow via nm_create_escrow_order RPC
// ─────────────────────────────────────────────────────────────────────────────

export async function createEscrowOrder(data: {
  listing_id: string
  quantity: number
  delivery_option: NmDeliveryOption
  delivery_address?: string
  notes?: string
}): Promise<{ order_id: string }> {
  const { supabase } = await requireAuth()

  const { data: orderId, error } = await supabase.rpc('nm_create_escrow_order', {
    p_listing_id: data.listing_id,
    p_quantity: data.quantity,
    p_delivery_option: data.delivery_option,
    p_delivery_address: data.delivery_address ?? null,
    p_notes: data.notes ?? null,
  })

  if (error || !orderId) {
    console.error('nm_create_escrow_order error:', error)
    throw new Error(error?.message ?? 'Failed to create order')
  }

  revalidatePath('/app/market/orders')
  return { order_id: orderId as string }
}

export async function releaseEscrow(orderId: string): Promise<void> {
  const { supabase } = await requireAuth()

  const { error } = await supabase.rpc('nm_release_escrow', { p_order_id: orderId })
  if (error) throw new Error(error.message ?? 'Failed to release escrow')

  revalidatePath('/app/market/orders')
}

export async function openDispute(orderId: string, notes: string): Promise<void> {
  const { supabase } = await requireAuth()

  const { error } = await supabase.rpc('nm_open_dispute', {
    p_order_id: orderId,
    p_notes: notes,
  })
  if (error) throw new Error(error.message ?? 'Failed to open dispute')

  revalidatePath('/app/market/orders')
}

export async function fetchMyOrders(role: 'buyer' | 'seller'): Promise<NmOrder[]> {
  const { supabase, authUser } = await requireAuth()

  let query
  if (role === 'buyer') {
    query = supabase
      .from('nm_orders')
      .select(`*,
        listing:nm_listings(id, title),
        listing_images:nm_listing_images(image_url, sort_order),
        seller_profile:nm_seller_profiles(id, business_name, logo_url, user_id)`)
      .eq('buyer_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(50)
  } else {
    // Seller — need to join through nm_seller_profiles
    const { data: sp } = await supabase
      .from('nm_seller_profiles').select('id').eq('user_id', authUser.id).maybeSingle()
    if (!sp) return []

    query = supabase
      .from('nm_orders')
      .select(`*,
        listing:nm_listings(id, title),
        listing_images:nm_listing_images(image_url, sort_order),
        buyer_profile:users!nm_orders_buyer_id_fkey(id, fullname, username, profile_image_url)`)
      .eq('seller_id', sp.id)
      .order('created_at', { ascending: false })
      .limit(50)
  }

  const { data, error } = await query
  if (error) { console.error('fetchMyOrders error:', error); return [] }
  return (data ?? []) as NmOrder[]
}

export async function updateOrderStatus(
  orderId: string,
  status: 'confirmed' | 'packed' | 'shipped' | 'cancelled'
): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  // Verify seller ownership
  const { data: sp } = await supabase
    .from('nm_seller_profiles').select('id').eq('user_id', authUser.id).maybeSingle()
  if (!sp) throw new Error('No seller profile')

  const { error } = await supabase
    .from('nm_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('seller_id', sp.id)

  if (error) throw new Error('Failed to update order')
  revalidatePath('/app/market/orders')
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS (artisan services)
// ─────────────────────────────────────────────────────────────────────────────

export async function createBooking(data: {
  listing_id: string
  artisan_user_id: string
  booking_date: string
  booking_time?: string
  address?: string
  notes?: string
  deposit_amount?: number
}): Promise<{ id: string }> {
  const { supabase, authUser } = await requireAuth()

  const { data: booking, error } = await supabase
    .from('nm_bookings')
    .insert({
      listing_id: data.listing_id,
      customer_id: authUser.id,
      artisan_user_id: data.artisan_user_id,
      booking_date: data.booking_date,
      booking_time: data.booking_time ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      deposit_amount: data.deposit_amount ?? 0,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !booking) throw new Error('Failed to create booking')
  revalidatePath('/app/market/bookings')
  return { id: booking.id }
}

export async function fetchMyBookings(role: 'customer' | 'artisan'): Promise<NmBooking[]> {
  const { supabase, authUser } = await requireAuth()
  const field = role === 'customer' ? 'customer_id' : 'artisan_user_id'

  const { data, error } = await supabase
    .from('nm_bookings')
    .select(`*,
      listing:nm_listings(id, title),
      listing_images:nm_listing_images(image_url, sort_order)`)
    .eq(field, authUser.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return (data ?? []) as NmBooking[]
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  const { error } = await supabase
    .from('nm_bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .or(`customer_id.eq.${authUser.id},artisan_user_id.eq.${authUser.id}`)

  if (error) throw new Error('Failed to update booking')
  revalidatePath('/app/market/bookings')
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchListingReviews(listingId: string): Promise<NmReview[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('nm_reviews')
    .select(`*,
      reviewer:users!nm_reviews_reviewer_id_fkey(id, fullname, username, profile_image_url)`)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as NmReview[]
}

export async function submitReview(data: {
  listing_id: string
  order_id?: string
  rating: number
  comment?: string
  photo_urls?: string[]
}): Promise<void> {
  const { supabase, authUser } = await requireAuth()

  const { error } = await supabase.from('nm_reviews').upsert(
    {
      listing_id: data.listing_id,
      order_id: data.order_id ?? null,
      reviewer_id: authUser.id,
      rating: data.rating,
      comment: data.comment ?? null,
      photo_urls: data.photo_urls ?? [],
    },
    { onConflict: 'listing_id,reviewer_id' }
  )

  if (error) throw new Error('Failed to submit review')
  revalidatePath(`/app/market/${data.listing_id}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVED LISTINGS (wishlist)
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleSavedListing(listingId: string): Promise<boolean> {
  const { supabase, authUser } = await requireAuth()

  const { data: existing } = await supabase
    .from('nm_saved_listings')
    .select('id')
    .eq('user_id', authUser.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existing) {
    await supabase.from('nm_saved_listings')
      .delete().eq('id', existing.id)
    return false // removed
  } else {
    await supabase.from('nm_saved_listings')
      .insert({ user_id: authUser.id, listing_id: listingId })
    return true // saved
  }
}

export async function fetchSavedListings(): Promise<NmListingDetail[]> {
  const { supabase, authUser } = await requireAuth()

  const { data } = await supabase
    .from('nm_saved_listings')
    .select(`listing:nm_listing_detail_view!nm_saved_listings_listing_id_fkey(*)`)
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return ((data ?? []).map((r: any) => r.listing).filter(Boolean)) as NmListingDetail[]
}

// ─────────────────────────────────────────────────────────────────────────────
// MY LISTINGS (seller dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchMyListings(): Promise<NmListingDetail[]> {
  const { supabase, authUser } = await requireAuth()

  const { data } = await supabase
    .from('nm_listings')
    .select(`
      *,
      seller_profile:nm_seller_profiles!nm_listings_seller_id_fkey(
        id, business_name, logo_url, tier, is_verified, tradecred_score, rating, user_id
      ),
      listing_images:nm_listing_images(image_url, sort_order),
      category:services_categories(id, name, service_type)
    `)
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return ((data ?? []).map((row: any) => {
    const images = (row.listing_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url)
    const sp = row.seller_profile ?? {}
    return {
      ...row,
      seller_business_name: sp.business_name ?? null,
      seller_tier: sp.tier ?? 'free',
      seller_is_verified: sp.is_verified ?? false,
      seller_tradecred_score: sp.tradecred_score ?? 0,
      seller_rating: sp.rating ?? 0,
      seller_fullname: null,
      seller_profile_image_url: sp.logo_url ?? null,
      seller_username: null,
      category_name: row.category?.name ?? null,
      category_type: row.category?.service_type ?? null,
      cover_image_url: images[0] ?? null,
      image_urls: images,
      is_saved: false,
      seller_profile: undefined,
      listing_images: undefined,
      category: undefined,
    } as NmListingDetail
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// STOREFRONTS — backed by nm_seller_profiles (the real "storefront" equivalent)
// ─────────────────────────────────────────────────────────────────────────────

export interface StorefrontData {
  business_name: string
  slug?: string
  bio?: string
  logo_url?: string
  state?: string
  lga?: string
  city?: string
  phone?: string
}

/** Create or update the current user's seller profile (= their storefront) */
export async function createStorefront(data: StorefrontData): Promise<{ id: string }> {
  const { supabase, authUser } = await requireAuth()

  const { data: existing } = await supabase
    .from('nm_seller_profiles')
    .select('id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('nm_seller_profiles')
      .update({
        business_name: data.business_name,
        bio: data.bio ?? null,
        logo_url: data.logo_url ?? null,
        state: data.state ?? null,
        city: data.city ?? null,
        phone: data.phone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    revalidatePath('/app/market/stores')
    return { id: existing.id }
  }

  const { data: created, error } = await supabase
    .from('nm_seller_profiles')
    .insert({
      user_id: authUser.id,
      business_name: data.business_name,
      bio: data.bio ?? null,
      logo_url: data.logo_url ?? null,
      state: data.state ?? null,
      city: data.city ?? null,
      phone: data.phone ?? null,
    })
    .select('id')
    .single()

  if (error || !created) throw new Error('Failed to create storefront')
  revalidatePath('/app/market/stores')
  return { id: created.id }
}

/** Fetch active seller profiles as storefronts */
export async function fetchStorefronts(cursor?: string): Promise<{
  storefronts: any[]
  nextCursor: string | null
}> {
  const supabase = await createClient()

  let query = supabase
    .from('nm_seller_profiles')
    .select(`
      id, user_id, business_name, bio, logo_url, state, city, phone,
      tier, is_verified, tradecred_score, rating, total_sales, created_at,
      owner:users!nm_seller_profiles_user_id_fkey(id, fullname, username, profile_image_url)
    `)
    .gt('total_sales', -1)         // all profiles
    .order('total_sales', { ascending: false })
    .limit(21)

  if (cursor) query = (query as any).lt('created_at', cursor)

  const { data, error } = await query
  if (error) return { storefronts: [], nextCursor: null }

  const page = (data ?? []).slice(0, 20)
  const hasMore = (data ?? []).length > 20

  // Attach listing count to each storefront
  const storefronts = await Promise.all(
    page.map(async (sp: any) => {
      const { count } = await supabase
        .from('nm_listings')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sp.id)
        .eq('is_active', true)
      return { ...sp, product_count: count ?? 0 }
    })
  )

  return {
    storefronts,
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  }
}

/** Fetch a single storefront by seller profile id or user_id */
export async function fetchStorefrontBySlug(slug: string): Promise<any | null> {
  // slug is treated as the seller profile id for simplicity
  const supabase = await createClient()

  const { data: sp, error } = await supabase
    .from('nm_seller_profiles')
    .select(`
      id, user_id, business_name, bio, logo_url, state, city, phone,
      tier, is_verified, tradecred_score, rating, total_sales, created_at,
      owner:users!nm_seller_profiles_user_id_fkey(id, fullname, username, profile_image_url)
    `)
    .eq('id', slug)
    .maybeSingle()

  if (error || !sp) return null

  const { data: listings } = await supabase
    .from('nm_listings')
    .select(`id, title, price, condition, is_active, created_at,
             listing_images:nm_listing_images(image_url, sort_order)`)
    .eq('seller_id', sp.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const products = (listings ?? []).map((l: any) => {
    const imgs = (l.listing_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    return { ...l, cover_image: imgs[0]?.image_url ?? null, listing_images: undefined }
  })

  return { ...sp, products, product_count: products.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTISANS — nm_listings with listing_type = 'service'
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchArtisans(filters: {
  category_id?: string
  state?: string
  search?: string
  cursor?: string
} = {}): Promise<{ artisans: any[]; nextCursor: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('nm_listings')
    .select(`
      id, seller_id, user_id, title, description, price, state, city,
      rating, review_count, is_active, tags, created_at,
      seller_profile:nm_seller_profiles!nm_listings_seller_id_fkey(
        id, business_name, bio, logo_url, is_verified, tradecred_score, rating
      ),
      listing_images:nm_listing_images(image_url, sort_order),
      category:services_categories(id, name)
    `)
    .eq('listing_type', 'service')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(25)

  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.state) query = query.eq('state', filters.state)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.cursor) query = (query as any).lt('created_at', filters.cursor)

  const { data, error } = await query
  if (error) return { artisans: [], nextCursor: null }

  const hasMore = (data ?? []).length >= 25
  const page = (data ?? []).slice(0, 25)

  const artisans = page.map((row: any) => {
    const imgs = (row.listing_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    const sp = row.seller_profile ?? {}
    return {
      ...row,
      cover_image_url: imgs[0]?.image_url ?? null,
      image_urls: imgs.map((i: any) => i.image_url),
      seller_business_name: sp.business_name ?? null,
      seller_is_verified: sp.is_verified ?? false,
      seller_bio: sp.bio ?? null,
      seller_logo_url: sp.logo_url ?? null,
      category_name: row.category?.name ?? null,
      seller_profile: undefined,
      listing_images: undefined,
      category: undefined,
    }
  })

  return { artisans, nextCursor: hasMore ? page[page.length - 1].created_at : null }
}

/** Create/update an artisan service listing */
export async function createOrUpdateArtisanProfile(data: {
  title?: string
  description?: string
  category_id?: string
  price?: number
  state?: string
  city?: string
  tags?: string[]
}): Promise<void> {
  const { supabase, authUser } = await requireAuth()
  const sellerId = await getOrCreateSellerProfile(supabase, authUser.id)

  // Check if user already has a service listing
  const { data: existing } = await supabase
    .from('nm_listings')
    .select('id')
    .eq('user_id', authUser.id)
    .eq('listing_type', 'service')
    .maybeSingle()

  if (existing) {
    await supabase.from('nm_listings')
      .update({
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category_id !== undefined && { category_id: data.category_id }),
        ...(data.price && { price: data.price }),
        ...(data.state && { state: data.state }),
        ...(data.city && { city: data.city }),
        ...(data.tags && { tags: data.tags }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('nm_listings').insert({
      seller_id: sellerId,
      user_id: authUser.id,
      title: data.title ?? 'My Services',
      description: data.description ?? '',
      listing_type: 'service',
      price: data.price ?? 0,
      category_id: data.category_id ?? null,
      state: data.state ?? null,
      city: data.city ?? null,
      tags: data.tags ?? [],
      delivery_option: 'none',
      is_active: true,
    })
  }
  revalidatePath('/app/market/artisans')
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPAT — old component files call confirmDelivery, raiseDispute, createOrder, createProduct
// These are thin wrappers around the new nm_* equivalents.
// ─────────────────────────────────────────────────────────────────────────────

/** Alias: buyer confirms delivery → releases escrow */
export async function confirmDelivery(orderId: string): Promise<void> {
  return releaseEscrow(orderId)
}

/** Alias: raise a dispute on an order */
export async function raiseDispute(data: {
  order_id: string
  reason: string
  description: string
  evidence_urls?: string[]
}): Promise<void> {
  return openDispute(data.order_id, `${data.reason}: ${data.description}`)
}

/** Alias: createOrder → createEscrowOrder with pickup default */
export async function createOrder(data: {
  product_id: string          // listing_id in nm_*
  quantity: number
  delivery_method: string
  delivery_address?: string
}): Promise<{ id: string; paystack_ref: string }> {
  const deliveryMap: Record<string, NmDeliveryOption> = {
    delivery: 'local_delivery',
    pickup: 'pickup',
    nationwide: 'nationwide',
  }
  const opt: NmDeliveryOption = deliveryMap[data.delivery_method] ?? 'pickup'
  const { order_id } = await createEscrowOrder({
    listing_id: data.product_id,
    quantity: data.quantity,
    delivery_option: opt,
    delivery_address: data.delivery_address,
  })
  return { id: order_id, paystack_ref: `mkt_${order_id.slice(0, 8)}_${Date.now()}` }
}

/** Alias: createProduct → createListing with listing_type=product */
export async function createProduct(data: {
  title: string
  description: string
  category: string
  cover_url?: string | null
  pricing_tiers?: Array<{ label: string; price: number; description: string }>
  images?: string[]
}): Promise<{ id: string }> {
  // Map old ServiceFormData shape to new CreateListingData
  const images = data.images ?? (data.cover_url ? [data.cover_url] : [])
  const price = data.pricing_tiers?.[0]?.price ?? 0
  return createListing({
    title: data.title,
    description: data.description,
    listing_type: 'product',
    price,
    images,
    delivery_option: 'none',
  })
}
