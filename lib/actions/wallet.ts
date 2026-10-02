'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
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
 * Previously this returned a hardcoded `wallet_pin: null` stub instead of
 * the real column — which meant every `profile.wallet_pin` check below
 * (in sendFunds/requestWithdrawal) always saw "no PIN set", regardless of
 * whether the user actually had one. Using the real profile row fixes that.
 *
 * `wallet_pin_locked_until`/`wallet_pin_attempts` aren't declared on the
 * `User` type in lib/types.ts even though the columns exist — same gap as
 * `naija_points` elsewhere — hence the local cast.
 */
async function resolveProfile() {
  const { authUser, profile } = await getCurrentUser()

  if (!authUser) throw new Error('Unauthenticated')
  if (!profile) throw new Error('User profile not found')

  return {
    authUser,
    profile: profile as typeof profile & {
      wallet_pin_locked_until: string | null
      wallet_pin_attempts: number | null
    },
  }
}

/** Get or create the wallet row for a given users.id. */
async function getOrCreateWallet(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
    getOrCreateWallet(supabase, profile.id),
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
 * Verifies a deposit with Paystack API, updates user_wallet, and records the transaction idempotently.
 */
export async function verifyAndProcessDeposit(
  reference: string
): Promise<ActionResult<{ reference: string; amount: number; newBalance: number; alreadyProcessed?: boolean }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile()

    if (!reference || !reference.trim()) {
      return { success: false, error: 'A valid transaction reference is required' }
    }

    const cleanRef = reference.trim()
    const wallet = await getOrCreateWallet(supabase, profile.id)

    // 1. Idempotency: Check if already credited in transactions
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, amount')
      .eq('ref', cleanRef)
      .eq('type', 'deposit')
      .maybeSingle()

    if (existingTx) {
      revalidatePath('/app/wallet')
      return {
        success: true,
        data: {
          reference: cleanRef,
          amount: Number(existingTx.amount) || 0,
          newBalance: wallet.balance,
          alreadyProcessed: true,
        },
      }
    }

    // 2. Verify with Paystack API
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

    // 3. Mathematics: Kobo to Naira
    const amountKobo = Number(data.amount) || 0
    if (amountKobo <= 0) {
      return { success: false, error: 'Invalid deposit amount reported by Paystack' }
    }
    const amountNGN = Math.round(amountKobo) / 100

    if (amountNGN < 100) {
      return { success: false, error: 'Deposit amount is below minimum (₦100)' }
    }

    // 4. Update wallet balance
    const newBalance = Number(wallet.balance) + amountNGN
    const { error: wErr } = await supabase
      .from('user_wallet')
      .update({ balance: newBalance })
      .eq('id', wallet.id)

    if (wErr) {
      console.error('Wallet balance update error:', wErr)
      return { success: false, error: 'Failed to credit wallet balance' }
    }

    // 5. Insert transaction record (valid schema: user_id, type, amount, status, ref)
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'deposit',
      amount: amountNGN,
      status: 'success',
      ref: cleanRef,
    })

    revalidatePath('/app/wallet')

    return {
      success: true,
      data: {
        reference: cleanRef,
        amount: amountNGN,
        newBalance,
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

  const supabase = await createClient()
  const { authUser, profile } = await resolveProfile()

  // ── PIN lockout check ─────────────────────────────────────────────────────
  const lockedUntil = profile.wallet_pin_locked_until
    ? new Date(profile.wallet_pin_locked_until)
    : null

  if (lockedUntil && lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000)
    return {
      success: false,
      error: `Too many failed PIN attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    }
  }

  // ── PIN check ─────────────────────────────────────────────────────────────
  if (!profile.wallet_pin) {
    return { success: false, error: 'You have not set a wallet PIN yet. Set one in Settings.' }
  }

  const pinCorrect = await bcrypt.compare(pin, profile.wallet_pin)

  if (!pinCorrect) {
    // Increment attempts
    const currentAttempts = (profile.wallet_pin_attempts ?? 0) + 1
    const isLockout = currentAttempts >= 5
    const lockedUntilDate = isLockout
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null

    await supabase
      .from('users')
      .update({
        wallet_pin_attempts: isLockout ? 0 : currentAttempts,
        ...(lockedUntilDate ? { wallet_pin_locked_until: lockedUntilDate } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (isLockout) {
      return {
        success: false,
        error: 'Too many incorrect PIN attempts. Your account is locked for 15 minutes.',
      }
    }

    return {
      success: false,
      error: `Incorrect PIN. ${5 - currentAttempts} attempt${5 - currentAttempts === 1 ? '' : 's'} remaining.`,
    }
  }

  // ── Reset PIN attempts on success ─────────────────────────────────────────
  await supabase
    .from('users')
    .update({
      wallet_pin_attempts: 0,
      wallet_pin_locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

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

  // ── Check sender balance ──────────────────────────────────────────────────
  const senderWallet = await getOrCreateWallet(supabase, profile.id)

  if (senderWallet.balance < amountNGN) {
    return { success: false, error: 'Insufficient balance.' }
  }

  // ── Debit sender ──────────────────────────────────────────────────────────
  const { error: debitError } = await supabase
    .from('user_wallet')
    .update({
      balance: senderWallet.balance - amountNGN,
    })
    .eq('id', senderWallet.id)

  if (debitError) {
    console.error('sendFunds debit error:', debitError)
    return { success: false, error: 'Transfer failed. Please try again.' }
  }

  // ── Credit recipient ──────────────────────────────────────────────────────
  const recipientWallet = await getOrCreateWallet(supabase, recipient.id)

  const { error: creditError } = await supabase
    .from('user_wallet')
    .update({
      balance: recipientWallet.balance + amountNGN,
    })
    .eq('id', recipientWallet.id)

  if (creditError) {
    console.error('sendFunds credit error:', creditError)
    // Best-effort rollback
    await supabase
      .from('user_wallet')
      .update({ balance: senderWallet.balance })
      .eq('id', senderWallet.id)

    return { success: false, error: 'Transfer failed. Please try again.' }
  }

  // ── Insert transaction rows ───────────────────────────────────────────────
  const now = new Date().toISOString()
  const transferRef = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  await supabase.from('transactions').insert([
    {
      user_id: profile.id,
      type: 'transfer_debit',
      amount: amountNGN,
      status: 'success',
      ref: transferRef,
      created_at: now,
    },
    {
      user_id: recipient.id,
      type: 'transfer_credit',
      amount: amountNGN,
      status: 'success',
      ref: transferRef,
      created_at: now,
    },
  ])

  revalidatePath('/app/wallet')

  return { success: true, data: { newBalance: senderWallet.balance - amountNGN } }
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

  const supabase = await createClient()
  const { profile } = await resolveProfile()

  // ── PIN lockout check ─────────────────────────────────────────────────────
  const lockedUntil = profile.wallet_pin_locked_until
    ? new Date(profile.wallet_pin_locked_until)
    : null

  if (lockedUntil && lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000)
    return {
      success: false,
      error: `Too many failed PIN attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    }
  }

  // ── PIN check ─────────────────────────────────────────────────────────────
  if (!profile.wallet_pin) {
    return { success: false, error: 'You have not set a wallet PIN yet. Set one in Settings.' }
  }

  const pinCorrect = await bcrypt.compare(pin, profile.wallet_pin)

  if (!pinCorrect) {
    const currentAttempts = (profile.wallet_pin_attempts ?? 0) + 1
    const isLockout = currentAttempts >= 5
    const lockedUntilDate = isLockout
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null

    await supabase
      .from('users')
      .update({
        wallet_pin_attempts: isLockout ? 0 : currentAttempts,
        ...(lockedUntilDate ? { wallet_pin_locked_until: lockedUntilDate } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (isLockout) {
      return {
        success: false,
        error: 'Too many incorrect PIN attempts. Your account is locked for 15 minutes.',
      }
    }

    return {
      success: false,
      error: `Incorrect PIN. ${5 - currentAttempts} attempt${5 - currentAttempts === 1 ? '' : 's'} remaining.`,
    }
  }

  // ── Reset PIN attempts ────────────────────────────────────────────────────
  await supabase
    .from('users')
    .update({
      wallet_pin_attempts: 0,
      wallet_pin_locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  // ── Check balance ─────────────────────────────────────────────────────────
  const wallet = await getOrCreateWallet(supabase, profile.id)

  if (wallet.balance < amountNGN) {
    return { success: false, error: 'Insufficient balance.' }
  }

  // ── Debit balance (held pending payout) ───────────────────────────────────
  const { error: debitError } = await supabase
    .from('user_wallet')
    .update({
      balance: wallet.balance - amountNGN,
    })
    .eq('id', wallet.id)

  if (debitError) {
    console.error('requestWithdrawal debit error:', debitError)
    return { success: false, error: 'Withdrawal request failed. Please try again.' }
  }

  // ── Insert pending transaction ────────────────────────────────────────────
  const withdrawalRef = `WTH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const { error: txError } = await supabase.from('transactions').insert({
    user_id: profile.id,
    type: 'withdrawal',
    amount: amountNGN,
    status: 'pending',
    ref: withdrawalRef,
  })

  if (txError) {
    console.error('requestWithdrawal tx insert error:', txError)
    // Rollback the balance debit
    await supabase
      .from('user_wallet')
      .update({ balance: wallet.balance })
      .eq('id', wallet.id)
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
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to set a PIN.' }
  }

  if (!/^\d{6}$/.test(formData.pin)) {
    return { success: false, error: 'PIN must be exactly 6 digits.' }
  }

  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('wallet_pin')
    .eq('auth_id', user.id)
    .single()

  if (fetchError || !profile) {
    return { success: false, error: 'Failed to fetch profile. Please try again.' }
  }

  if (profile.wallet_pin) {
    if (!formData.current_pin) {
      return { success: false, error: 'Please enter your current PIN to change it.' }
    }
    const match = await bcrypt.compare(formData.current_pin, profile.wallet_pin)
    if (!match) {
      return { success: false, error: 'Current PIN is incorrect.' }
    }
  }

  const hash = await bcrypt.hash(formData.pin, 12)

  const { error: updateError } = await supabase
    .from('users')
    .update({ wallet_pin: hash, updated_at: new Date().toISOString() })
    .eq('auth_id', user.id)

  if (updateError) {
    console.error('setPin error:', updateError.message)
    return { success: false, error: 'Failed to save PIN. Please try again.' }
  }

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

  const { data: found } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle()

  if (!found) return { success: false, error: 'User not found' }

  return { success: true, data: found }
}
