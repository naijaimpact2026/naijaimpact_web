// ============================================================
// lib/types.ts
// Hubnovo – TypeScript types matching the Supabase DB schema
// Column names are snake_case to match the SQL definitions exactly.
// ============================================================

// ─────────────────────────────────────────────
// Core Social Tables
// ─────────────────────────────────────────────

export type User = {
  id: string
  auth_id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  profession: string | null
  verified: boolean
  onboarded: boolean
  wallet_pin: string | null
  notifications_follows: boolean
  notifications_reactions: boolean
  notifications_comments: boolean
  notifications_mentions: boolean
  is_private: boolean
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  author_id: string
  type: 'text' | 'image' | 'video'
  caption: string | null
  hashtags: string[]
  created_at: string
  updated_at: string
}

export type PostMedia = {
  id: string
  post_id: string
  url: string
  media_type: 'image' | 'video'
  width: number | null
  height: number | null
  duration_s: number | null
  position: number
  created_at: string
}

export type PostComment = {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
}

export type PostReaction = {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

export type UserFollow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// ─────────────────────────────────────────────
// Funding / Payments Tables
// ─────────────────────────────────────────────

export type Campaign = {
  id: string
  creator_id: string
  type: 'campaign' | 'project'
  title: string
  description: string | null
  cover_url: string | null
  goal_amount: number
  amount_raised: number
  deadline: string          // ISO date string (DATE column)
  status: 'active' | 'completed' | 'cancelled'
  donor_count: number
  created_at: string
  updated_at: string
}

export type Wallet = {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer_debit'
  | 'transfer_credit'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'insurance_premium'
  | 'ajo_contribution'
  | 'ajo_payout'
  | 'savings_topup'
  | 'savings_withdrawal'
  | 'course_purchase'
  | 'campaign_donation'
  | 'marketplace_purchase'

export type Transaction = {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  status: 'pending' | 'success' | 'failed'
  reference_id: string | null
  paystack_ref: string | null
  description: string | null
  created_at: string
}

// ─────────────────────────────────────────────
// Learning Tables
// ─────────────────────────────────────────────

export type Course = {
  id: string
  creator_id: string
  title: string
  description: string | null
  category: string
  thumbnail_url: string | null
  price: number
  published: boolean
  created_at: string
  updated_at: string
}

export type CourseSection = {
  id: string
  course_id: string
  title: string
  position: number
  created_at: string
}

export type CourseLesson = {
  id: string
  section_id: string
  title: string
  video_url: string | null
  duration_s: number | null
  position: number
  created_at: string
}

export type CourseEnrollment = {
  id: string
  user_id: string
  course_id: string
  status: 'enrolled' | 'completed' | 'dropped'
  progress: number          // 0–100
  last_lesson_id: string | null
  created_at: string
  updated_at: string
}

export type PricingTier = {
  label: string
  price: number
  description: string
}

export type Service = {
  id: string
  provider_id: string
  title: string
  description: string | null
  category: string
  cover_url: string | null
  pricing_tiers: PricingTier[]
  active: boolean
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'follow'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'ajo_contribution'
  | 'loan_approved'
  | 'loan_overdue'
  | 'goal_achieved'
  | 'ajo_payout'
  | 'dispute_raised'

export type Notification = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: NotificationType
  reference_id: string | null
  read: boolean
  created_at: string
}

// ─────────────────────────────────────────────
// Fintech — NaijaAjo (Digital Cooperative Savings)
// ─────────────────────────────────────────────

export type AjoFrequency = 'weekly' | 'biweekly' | 'monthly'

export type AjoGroupStatus = 'active' | 'completed' | 'cancelled'

export type AjoGroup = {
  id: string
  creator_id: string
  name: string
  contribution_amount: number
  frequency: AjoFrequency
  member_limit: number
  start_date: string        // ISO date string
  current_cycle: number
  total_collected: number
  status: AjoGroupStatus
  created_at: string
}

export type AjoMemberStatus = 'active' | 'delinquent' | 'exited'

export type AjoMember = {
  id: string
  group_id: string
  user_id: string
  payout_position: number
  status: AjoMemberStatus
  joined_at: string
}

export type AjoContributionStatus = 'pending' | 'paid' | 'missed'

export type AjoContribution = {
  id: string
  group_id: string
  member_id: string
  cycle: number
  amount: number
  status: AjoContributionStatus
  paid_at: string | null
  created_at: string
}

export type AjoPayoutStatus = 'pending' | 'paid'

export type AjoPayoutSchedule = {
  id: string
  group_id: string
  cycle: number
  recipient_id: string
  amount: number
  due_date: string          // ISO date string
  paid_at: string | null
  status: AjoPayoutStatus
  created_at: string
}

export type AjoDisputeStatus = 'open' | 'resolved' | 'dismissed'

export type AjoDispute = {
  id: string
  group_id: string
  raised_by: string
  description: string
  status: AjoDisputeStatus
  created_at: string
}

// ─────────────────────────────────────────────
// Fintech — NaijaSafe (Personal Savings)
// ─────────────────────────────────────────────

export type SafeFlexibleAccount = {
  id: string
  user_id: string
  name: string
  balance: number
  created_at: string
  updated_at: string
}

export type SafeLockedStatus = 'locked' | 'matured' | 'withdrawn'

export type SafeLockedSavings = {
  id: string
  user_id: string
  name: string
  amount: number
  lock_until: string        // ISO date string
  interest_rate: number
  status: SafeLockedStatus
  created_at: string
}

export type SafeGoalStatus = 'active' | 'achieved' | 'cancelled'

export type SafeGoalSavings = {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null  // ISO date string
  status: SafeGoalStatus
  created_at: string
  updated_at: string
}

// Union type for any safe account variant
export type SafeAccount =
  | (SafeFlexibleAccount & { account_variant: 'flexible' })
  | (SafeLockedSavings & { account_variant: 'locked' })
  | (SafeGoalSavings & { account_variant: 'goal' })

// ─────────────────────────────────────────────
// Fintech — TradeCred (Alternative Credit Score)
// ─────────────────────────────────────────────

export type TradeCredTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum'

export type TradeCredScore = {
  id: string
  user_id: string
  score: number             // 0–1000
  tier: TradeCredTier
  updated_at: string
}

export type TradeCredActivityLog = {
  id: string
  user_id: string
  event_type: string
  point_impact: number      // positive or negative
  description: string
  created_at: string
}

// ─────────────────────────────────────────────
// Fintech — NaijaCredit (Micro-lending)
// ─────────────────────────────────────────────

export type LoanProduct = {
  id: string
  name: string
  min_amount: number
  max_amount: number
  interest_rate_pa: number
  tenure_options: number[]  // months
  min_tradecred_score: number
  active: boolean
  created_at: string
}

export type LoanApplicationStatus = 'pending' | 'approved' | 'rejected'

export type LoanApplication = {
  id: string
  user_id: string
  product_id: string
  amount: number
  tenure_months: number
  status: LoanApplicationStatus
  created_at: string
}

export type LoanStatus = 'pending' | 'active' | 'completed' | 'defaulted'

export type Loan = {
  id: string
  application_id: string
  user_id: string
  principal: number
  total_interest: number
  tenure_months: number
  status: LoanStatus
  disbursed_at: string | null
  created_at: string
}

export type RepaymentStatus = 'pending' | 'paid' | 'overdue'

export type LoanRepayment = {
  id: string
  loan_id: string
  installment: number
  amount: number
  due_date: string          // ISO date string
  paid_at: string | null
  late_fee: number
  status: RepaymentStatus
  created_at: string
}

// ─────────────────────────────────────────────
// Fintech — NaijaInsure (Micro-insurance)
// ─────────────────────────────────────────────

export type InsureCategory = 'health' | 'device' | 'travel' | 'life'

export type InsureProduct = {
  id: string
  name: string
  description: string | null
  category: InsureCategory
  coverage_amount: number
  /** Monthly premium — maps to `monthly_premium` column in DB */
  premium_monthly: number
  /** Policy duration in months — maps to `duration_months` column in DB */
  coverage_months: number
  /** Alias for coverage_months (DB column name) */
  duration_months?: number
  /** Alias for premium_monthly (DB column name) */
  monthly_premium?: number
  active: boolean
  created_at: string
}

export type PolicyStatus = 'active' | 'expired' | 'cancelled'

export type Policy = {
  id: string
  user_id: string
  product_id: string
  status: PolicyStatus
  start_date: string        // ISO date string
  end_date: string          // ISO date string
  created_at: string
  updated_at: string
}

export type ClaimStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected'

export type Claim = {
  id: string
  policy_id: string
  user_id: string
  description: string
  document_urls: string[]
  status: ClaimStatus
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// NaijaMarket — Marketplace
// ─────────────────────────────────────────────

export type ProductCondition = 'new' | 'used_good' | 'used_fair' | 'refurbished'

export type ProductStatus = 'active' | 'sold' | 'paused' | 'removed'

export type MarketplaceProduct = {
  id: string
  seller_id: string
  storefront_id: string | null
  title: string
  description: string | null
  category: string
  subcategory: string | null
  images: string[]               // array of Cloudinary URLs
  price: number
  negotiable: boolean
  condition: ProductCondition
  brand: string | null
  stock_quantity: number
  location: string | null
  state: string | null           // Nigerian state
  delivery_options: string[]     // e.g. ['pickup', 'delivery']
  warranty: string | null
  return_policy: string | null
  specifications: Record<string, string>   // JSON key-value specs
  status: ProductStatus
  views: number
  ai_description: string | null  // AI-generated description
  ai_title: string | null        // AI-generated title
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

export type MarketplaceOrder = {
  id: string
  buyer_id: string
  seller_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  delivery_address: string | null
  delivery_method: string
  status: OrderStatus
  paystack_ref: string | null
  escrow_held: boolean
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  dispute_reason: string | null
  created_at: string
  updated_at: string
}

export type ReviewStatus = 'active' | 'removed'

export type MarketplaceReview = {
  id: string
  order_id: string
  reviewer_id: string
  seller_id: string
  product_id: string
  rating: number               // 1–5
  title: string | null
  body: string | null
  images: string[]
  status: ReviewStatus
  created_at: string
}

export type ArtisanCategory =
  | 'fashion'
  | 'carpentry'
  | 'electrical'
  | 'plumbing'
  | 'mechanics'
  | 'painting'
  | 'catering'
  | 'events'
  | 'photography'
  | 'design'
  | 'beauty'
  | 'cleaning'
  | 'solar'
  | 'construction'
  | 'technology'
  | 'other'

export type ArtisanProfile = {
  id: string
  user_id: string
  category: ArtisanCategory
  profession_title: string
  bio: string | null
  portfolio_images: string[]
  portfolio_videos: string[]
  certifications: string[]
  service_areas: string[]        // Nigerian states/cities
  pricing_from: number | null
  pricing_currency: string
  available: boolean
  response_time: string | null   // e.g. "Within 2 hours"
  years_experience: number | null
  languages: string[]
  verified: boolean
  created_at: string
  updated_at: string
}

export type StorefrontStatus = 'active' | 'paused' | 'suspended'

export type Storefront = {
  id: string
  owner_id: string
  slug: string                   // unique URL slug
  business_name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  cover_url: string | null
  category: string
  opening_hours: string | null
  phone: string | null
  email: string | null
  website: string | null
  social_links: Record<string, string>  // { instagram: '...', twitter: '...' }
  return_policy: string | null
  shipping_policy: string | null
  status: StorefrontStatus
  followers: number
  total_sales: number
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
}

export type SellerTrustScore = {
  id: string
  user_id: string
  score: number                  // 0–100
  transaction_count: number
  delivery_success_rate: number
  response_time_hours: number | null
  cancellation_rate: number
  return_rate: number
  complaint_rate: number
  years_on_platform: number
  repeat_customer_rate: number
  updated_at: string
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed'

export type MarketplaceDispute = {
  id: string
  order_id: string
  raised_by: string
  reason: string
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// Paystack metadata (shared across payment flows)
// ─────────────────────────────────────────────

export interface PaystackMetadata {
  type: 'deposit' | 'campaign_donation' | 'course_purchase' | 'insurance_premium' | 'marketplace_purchase'
  userId: string
  referenceId?: string      // campaign id, course id, policy id, order id
}

// ─────────────────────────────────────────────
// Composite / Join types used in UI components
// ─────────────────────────────────────────────

export type PostWithAuthor = Post & {
  author: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>
  medias: PostMedia[]
  reaction_count: number
  comment_count: number
  user_reacted: boolean
}

export type CampaignWithCreator = Campaign & {
  creator: Pick<User, 'username' | 'avatar_url'>
}

export type CourseWithInstructor = Course & {
  instructor: Pick<User, 'display_name' | 'avatar_url'>
}

export type ServiceWithProvider = Service & {
  provider: Pick<User, 'display_name' | 'avatar_url' | 'username'>
}

export type NotificationWithActor = Notification & {
  actor: Pick<User, 'username' | 'display_name' | 'avatar_url'> | null
}

export type ProductWithSeller = MarketplaceProduct & {
  seller: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>
  storefront: Pick<Storefront, 'id' | 'business_name' | 'logo_url' | 'slug'> | null
  review_count: number
  rating_average: number
}

export type OrderWithDetails = MarketplaceOrder & {
  product: Pick<MarketplaceProduct, 'id' | 'title' | 'images' | 'category'>
  buyer: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>
  seller: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export type ArtisanWithProfile = ArtisanProfile & {
  user: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>
  review_count: number
  rating_average: number
}

export type StorefrontWithOwner = Storefront & {
  owner: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>
  product_count: number
}

// ─────────────────────────────────────────────
// NaijaMarket — REAL nm_* schema types
// These match the actual Supabase tables used by the mobile app.
// ─────────────────────────────────────────────

// Enum values matching the Supabase enum types
export type NmListingType = 'product' | 'service' | 'rental' | 'auction'
export type NmListingCondition = 'new' | 'fairly_used' | 'used'
export type NmOrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded'
export type NmEscrowStatus = 'funded' | 'held' | 'released' | 'disputed' | 'refunded' | 'cancelled'
export type NmBookingStatus = 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
export type NmSellerTier = 'free' | 'premium' | 'verified_business' | 'enterprise'
export type NmDeliveryOption = 'pickup' | 'local_delivery' | 'nationwide' | 'none'

// nm_seller_profiles table
export type NmSellerProfile = {
  id: string
  user_id: string                    // references auth.users(id)
  business_name: string | null
  bio: string | null
  logo_url: string | null
  state: string | null
  lga: string | null
  city: string | null
  phone: string | null
  tier: NmSellerTier
  is_verified: boolean
  tradecred_score: number
  revenue_share: number
  total_sales: number
  rating: number
  created_at: string
  updated_at: string
}

// nm_listings table (base)
export type NmListing = {
  id: string
  seller_id: string                  // references nm_seller_profiles(id)
  user_id: string                    // references auth.users(id)
  title: string
  description: string
  listing_type: NmListingType
  condition: NmListingCondition | null
  category_id: string | null         // references services_categories(id)
  price: number
  negotiable: boolean
  stock: number
  state: string | null
  lga: string | null
  city: string | null
  delivery_option: NmDeliveryOption
  delivery_fee: number
  escrow_enabled: boolean
  financing_available: boolean
  installment_available: boolean
  is_active: boolean
  is_featured: boolean
  views_count: number
  orders_count: number
  rating: number
  review_count: number
  tags: string[]
  brand: string | null
  warranty_days: number
  created_at: string
  updated_at: string
}

// nm_listing_detail_view — the pre-built Supabase view (use this for fetching)
export type NmListingDetail = NmListing & {
  category_name: string | null
  category_type: string | null
  // Seller profile fields (from nm_seller_profiles join)
  seller_business_name: string | null
  seller_tier: NmSellerTier
  seller_is_verified: boolean
  seller_tradecred_score: number
  seller_rating: number
  // Seller user fields (from users join)
  seller_fullname: string | null
  seller_profile_image_url: string | null
  seller_username: string | null
  // Image fields (derived from nm_listing_images)
  cover_image_url: string | null
  image_urls: string[]
  // Auth-user specific
  is_saved: boolean
}

// nm_listing_images table
export type NmListingImage = {
  id: string
  listing_id: string
  image_url: string
  sort_order: number
  created_at: string
}

// nm_orders table
export type NmOrder = {
  id: string
  listing_id: string
  buyer_id: string                   // references auth.users(id)
  seller_id: string                  // references nm_seller_profiles(id)
  quantity: number
  unit_price: number
  delivery_fee: number
  total_amount: number
  delivery_option: NmDeliveryOption
  delivery_address: string | null
  status: NmOrderStatus
  tracking_code: string | null
  notes: string | null
  cancelled_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  // Joined relations (when fetched with select)
  listing?: { id: string; title: string } | null
  listing_images?: NmListingImage[]
  seller_profile?: Partial<NmSellerProfile> | null
  buyer_profile?: { id: string; fullname: string | null; username: string; profile_image_url: string | null } | null
}

// nm_escrow table
export type NmEscrow = {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  amount: number
  platform_fee: number
  seller_payout: number
  status: NmEscrowStatus
  funded_at: string | null
  released_at: string | null
  refunded_at: string | null
  dispute_opened_at: string | null
  dispute_resolved_at: string | null
  dispute_notes: string | null
  admin_notes: string | null
  wallet_ref: string | null
  created_at: string
  updated_at: string
}

// nm_bookings table
export type NmBooking = {
  id: string
  listing_id: string
  customer_id: string
  artisan_user_id: string
  booking_date: string
  booking_time: string | null
  address: string | null
  notes: string | null
  deposit_amount: number
  total_amount: number | null
  status: NmBookingStatus
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined
  listing?: { id: string; title: string } | null
  listing_images?: NmListingImage[]
}

// nm_reviews table
export type NmReview = {
  id: string
  listing_id: string
  order_id: string | null
  reviewer_id: string
  rating: number
  comment: string | null
  photo_urls: string[]
  created_at: string
  // Joined
  reviewer?: {
    id: string
    fullname: string | null
    username: string
    profile_image_url: string | null
  } | null
}

// nm_saved_listings table
export type NmSavedListing = {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

// services_categories table (used for category filter grid)
export type ServiceCategory = {
  id: string
  name: string
  service_type: string
}
