'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { checkWalletPin, setWalletPin } from '@/lib/wallet-pin'
import { rateLimit, RATE_LIMITED } from '@/lib/rate-limit'
import type { Transaction, Wallet } from '@/lib/types'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Resolve the platform users.id + full profile from the auth session.
 *
 * The wallet PIN is checked server-side via lib/wallet-pin.ts.
 */
async function resolveProfile() {
  const { authUser, profile } = await getCurrentUser()

  if (!authUser) throw new Error('Unauthenticated')
  if (!profile) throw new Error('User profile not found')

  return { authUser, profile }
}

/*
 * Balance and ledger writes go through the service client: clients can't
 * write user_wallet / transactions directly (see the Supabase migrations), so
 * every write below is scoped to the signed-in user (or the resolved
 * recipient) by these server actions.
 */
type DbClient = ReturnType<typeof createServiceClient>

/** Get or create the wallet row for a given users.id. */
async function getOrCreateWallet(
  supabase: DbClient,
  userId: string
): Promise<Wallet> {
  const { data: wallet } = await supabase
    .from('user_wallet')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (wallet) {
    // Ensure balance is always a number (DB may return null)
    return { ...wallet, balance: wallet.balance ?? 0 } as Wallet
  }

  const { data: created, error } = await supabase
    .from('user_wallet')
    .insert({ user_id: userId, balance: 0 })
    .select('*')
    .single()

  if (error || !created) {
    console.error('getOrCreateWallet insert error:', error)
    throw new Error('Failed to create wallet')
  }
  return { ...created, balance: created.balance ?? 0 } as Wallet
}

// ─────────────────────────────────────────────
// fetchWallet
// ─────────────────────────────────────────────

/** Fetch the wallet balance and last N transactions for the current user. */
export async function fetchWallet(limit = 10): Promise<{
  wallet: Wallet
  transactions: Transaction[]
}> {
  const supabase = await createClient()
  const { profile } = await resolveProfile()

  const [wallet, { data: transactions }] = await Promise.all([
    getOrCreateWallet(createServiceClient(), profile.id),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  return {
    wallet,
    transactions: (transactions ?? []) as Transaction[],
  }
}

// ─────────────────────────────────────────────
// verifyAndProcessDeposit (Paystack Verification & Recovery)
// ─────────────────────────────────────────────

/**
 * Verifies a deposit with Paystack and credits it exactly once
 * (web_wallet_credit is idempotent per reference, so replays and concurrent
 * calls can't double-credit). The payment must be a wallet deposit made with
 * this user's email.
 */
export async function verifyAndProcessDeposit(
  reference: string
): Promise<ActionResult<{ reference: string; amount: number; newBalance: number; alreadyProcessed?: boolean }>> {
  try {
    const supabase = createServiceClient()
    const { authUser, profile } = await resolveProfile()

    if (!reference || !reference.trim()) {
      return { success: false, error: 'A valid transaction reference is required' }
    }
    if (!(await rateLimit(`deposit-verify:${profile.id}`, 20, 600))) {
      return { success: false, error: RATE_LIMITED }
    }

    const cleanRef = reference.trim()

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      return { success: false, error: 'Paystack secret key is missing on the server' }
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await res.json()
    if (!payload.status || !payload.data) {
      return { success: false, error: payload.message || 'Transaction not found on Paystack' }
    }

    const data = payload.data
    if (data.status !== 'success') {
      return { success: false, error: data.gateway_response || `Payment status is ${data.status}` }
    }

    // The payment must be a wallet deposit, in naira, paid by this user.
    const payerEmail = String(data.customer?.email ?? '').trim().toLowerCase()
    const myEmail = String(authUser.email ?? profile.email ?? '').trim().toLowerCase()
    if (data.metadata?.type !== 'deposit' || data.currency !== 'NGN' || !payerEmail || payerEmail !== myEmail) {
      return { success: false, error: 'This payment is not a wallet deposit from your account.' }
    }

    const amountKobo = Number(data.amount) || 0
    const amountNGN = Math.round(amountKobo) / 100
    if (amountNGN < 100) {
      return { success: false, error: 'Deposit amount is below minimum (₦100)' }
    }

    const { data: result, error: creditError } = await supabase.rpc('web_wallet_credit', {
      p_user_id: profile.id,
      p_amount: amountNGN,
      p_type: 'deposit',
      p_ref: cleanRef,
    })
    if (creditError) {
      console.error('Wallet credit error:', creditError)
      return { success: false, error: 'Failed to credit wallet balance' }
    }

    const wallet = await getOrCreateWallet(supabase, profile.id)
    revalidatePath('/app/wallet')

    return {
      success: true,
      data: {
        reference: cleanRef,
        amount: amountNGN,
        newBalance: wallet.balance,
        alreadyProcessed: result === 'already_credited',
      },
    }
  } catch (err: any) {
    console.error('verifyAndProcessDeposit error:', err)
    return { success: false, error: err.message || 'Deposit verification failed' }
  }
}

/**
 * Record and verify a Paystack reference after the popup onSuccess callback.
 */
export async function depositCallback(
  reference: string
): Promise<ActionResult<{ reference: string; amount?: number; newBalance?: number }>> {
  return verifyAndProcessDeposit(reference)
}

// ─────────────────────────────────────────────
// sendFunds
// ─────────────────────────────────────────────

/**
 * Transfer funds from the current user to a recipient by username.
 * Atomically:
 *   1. Verify PIN (with lockout after 5 consecutive failures)
 *   2. Check sender balance >= amount
 *   3. Debit sender wallet
 *   4. Credit recipient wallet
 *   5. Insert two transaction rows (transfer_debit + transfer_credit)
 *
 * Requirements: 9.3, 9.4, 9.5, 9.6, 9.7
 */
export async function sendFunds(
  recipientUsername: string,
  amountNGN: number,
  pin: string
): Promise<ActionResult<{ newBalance: number }>> {
  if (amountNGN < 50) {
    return { success: false, error: 'Minimum transfer amount is ₦50' }
  }

  const supabase = createServiceClient()
  const { profile } = await resolveProfile()

  if (!(await rateLimit(`send:${profile.id}`, 10, 600))) return { success: false, error: RATE_LIMITED }

  // ── PIN check (shared with mobile; locks for 15 min after 5 wrong tries) ──
  const pinResult = await checkWalletPin(profile.id, pin)
  if (!pinResult.ok) return { success: false, error: pinResult.error }

  // ── Resolve recipient ─────────────────────────────────────────────────────
  const { data: recipient } = await supabase
    .from('users')
    .select('id, display_name, username')
    .eq('username', recipientUsername.toLowerCase().trim())
    .maybeSingle()

  if (!recipient) {
    return { success: false, error: 'Recipient not found. Check the username and try again.' }
  }

  if (recipient.id === profile.id) {
    return { success: false, error: 'You cannot send funds to yourself.' }
  }

  // ── Move the money in one database transaction (no double spends) ───────
  const transferRef = `TRF-${crypto.randomUUID()}`
  const { data: newBalance, error: transferError } = await supabase.rpc('web_wallet_transfer', {
    p_sender: profile.id,
    p_recipient: recipient.id,
    p_amount: amountNGN,
    p_ref: transferRef,
  })

  if (transferError) {
    if (transferError.message?.includes('Insufficient')) return { success: false, error: 'Insufficient balance.' }
    console.error('sendFunds error:', transferError)
    return { success: false, error: 'Transfer failed. Please try again.' }
  }

  revalidatePath('/app/wallet')

  return { success: true, data: { newBalance: Number(newBalance) } }
}

// ─────────────────────────────────────────────
// requestWithdrawal
// ─────────────────────────────────────────────

/**
 * Request a bank withdrawal:
 *   1. Verify PIN
 *   2. Debit balance immediately (held pending manual payout)
 *   3. Insert a pending withdrawal transaction
 *
 * Requirements: 9.2, 10.1–10.6
 */
export async function requestWithdrawal(
  bankName: string,
  accountNumber: string,
  accountName: string,
  amountNGN: number,
  pin: string
): Promise<ActionResult> {
  if (amountNGN < 100) {
    return { success: false, error: 'Minimum withdrawal amount is ₦100' }
  }

  const supabase = createServiceClient()
  const { profile } = await resolveProfile()

  if (!(await rateLimit(`withdraw:${profile.id}`, 5, 3600))) return { success: false, error: RATE_LIMITED }

  // ── PIN check (shared with mobile; locks for 15 min after 5 wrong tries) ──
  const pinResult = await checkWalletPin(profile.id, pin)
  if (!pinResult.ok) return { success: false, error: pinResult.error }

  if (!/^\d{10}$/.test(accountNumber.trim()) || !bankName.trim() || !accountName.trim()) {
    return { success: false, error: 'Enter a valid bank, 10-digit account number and account name.' }
  }

  // ── Hold the amount and record a pending payout, atomically ──────────────
  const { error: debitError } = await supabase.rpc('web_wallet_debit', {
    p_user_id: profile.id,
    p_amount: amountNGN,
    p_type: 'withdrawal',
    p_ref: `WTH-${crypto.randomUUID()}`,
    p_status: 'pending',
    p_bank_name: bankName.trim(),
    p_account_number: accountNumber.trim(),
    p_account_name: accountName.trim(),
  })

  if (debitError) {
    if (debitError.message?.includes('Insufficient')) return { success: false, error: 'Insufficient balance.' }
    console.error('requestWithdrawal error:', debitError)
    return { success: false, error: 'Withdrawal request failed. Please try again.' }
  }

  revalidatePath('/app/wallet')

  return { success: true }
}

// ─────────────────────────────────────────────
// setPin  (re-exported for convenience; primary lives in profile.ts)
// ─────────────────────────────────────────────

/**
 * Set or update the wallet PIN for the current user.
 * Requirement: 10.8
 */
export async function setPin(formData: {
  pin: string
  current_pin?: string
}): Promise<ActionResult> {
  let profileId: string
  try {
    profileId = (await resolveProfile()).profile.id
  } catch {
    return { success: false, error: 'You must be signed in to set a PIN.' }
  }

  if (!(await rateLimit(`pin-set:${profileId}`, 5, 900))) return { success: false, error: RATE_LIMITED }

  const result = await setWalletPin(profileId, formData.pin, formData.current_pin || undefined)
  if (!result.ok) return { success: false, error: result.error }

  revalidatePath('/app/settings')
  revalidatePath('/app/wallet')

  return { success: true }
}

// ─────────────────────────────────────────────
// lookupUser
// ─────────────────────────────────────────────

/** Look up a user by username for the Send modal recipient step. */
export async function lookupUser(
  username: string
): Promise<ActionResult<{ id: string; display_name: string; avatar_url: string | null }>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { success: false, error: 'Unauthenticated' }
  if (!(await rateLimit(`lookup:${user.id}`, 30, 60))) return { success: false, error: RATE_LIMITED }

  const { data: found } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle()

  if (!found) return { success: false, error: 'User not found' }

  return { success: true, data: found }
}
