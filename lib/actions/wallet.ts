'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/supabase/auth'
import * as wallet from '@/lib/wallet/service'
import type { Transaction, Wallet } from '@/lib/types'

/*
 * Web server actions for the wallet. Thin wrappers: every check (PIN lockout,
 * rate limits, settlement) lives in lib/wallet/service.ts, which the mobile
 * REST API (app/api/wallet) calls too. Each export here is a public endpoint,
 * so each one authenticates from the cookie session itself.
 */

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

async function signedIn() {
  const { authUser, profile } = await getCurrentUser()
  if (!authUser) throw new Error('Unauthenticated')
  if (!profile) throw new Error('User profile not found')
  return { profile, email: String(authUser.email ?? profile.email ?? '') }
}

const refreshWallet = () => revalidatePath('/app/wallet')

/** Fetch the wallet balance and last N transactions for the current user. */
export async function fetchWallet(limit = 10): Promise<{ wallet: Wallet; transactions: Transaction[] }> {
  const { profile } = await signedIn()
  return wallet.getWallet(profile, limit)
}

/**
 * Verifies a deposit with Paystack and credits it exactly once (same
 * settlement as the webhook and the reconcile cron). Also used for "recover
 * my deposit" with a reference. The payment must have been made with this
 * user's email.
 */
export async function verifyAndProcessDeposit(
  reference: string
): Promise<ActionResult<{ reference: string; amount: number; newBalance: number; alreadyProcessed?: boolean }>> {
  try {
    const { profile, email } = await signedIn()
    const r = await wallet.verifyDeposit(profile, email, reference)
    if (!r.ok) return { success: false, error: r.error }
    if (r.status !== 'success') return { success: false, error: r.message }

    refreshWallet()
    return {
      success: true,
      data: { reference: r.reference, amount: r.amount, newBalance: r.newBalance, alreadyProcessed: r.alreadyProcessed },
    }
  } catch (err: any) {
    console.error('verifyAndProcessDeposit error:', err)
    return { success: false, error: err.message || 'Deposit verification failed' }
  }
}

/** Record and verify a Paystack reference after the popup onSuccess callback. */
export async function depositCallback(
  reference: string
): Promise<ActionResult<{ reference: string; amount?: number; newBalance?: number }>> {
  return verifyAndProcessDeposit(reference)
}

/** Send money to another user by username (PIN-checked, atomic). */
export async function sendFunds(
  recipientUsername: string,
  amountNGN: number,
  pin: string
): Promise<ActionResult<{ newBalance: number }>> {
  const { profile } = await signedIn()
  const r = await wallet.sendFunds(profile, recipientUsername, amountNGN, pin)
  if (!r.ok) return { success: false, error: r.error }

  refreshWallet()
  return { success: true, data: { newBalance: r.newBalance } }
}

/** Request a bank withdrawal: PIN, then hold the amount pending a manual payout. */
export async function requestWithdrawal(
  bankName: string,
  accountNumber: string,
  accountName: string,
  amountNGN: number,
  pin: string
): Promise<ActionResult> {
  const { profile } = await signedIn()
  const r = await wallet.requestWithdrawal(profile, { bankName, accountNumber, accountName, amount: amountNGN, pin })
  if (!r.ok) return { success: false, error: r.error }

  refreshWallet()
  return { success: true }
}

/** Set or update the wallet PIN for the current user. */
export async function setPin(formData: { pin: string; current_pin?: string }): Promise<ActionResult> {
  let profile
  try {
    profile = (await signedIn()).profile
  } catch {
    return { success: false, error: 'You must be signed in to set a PIN.' }
  }

  const r = await wallet.setPin(profile, formData.pin, formData.current_pin || undefined)
  if (!r.ok) return { success: false, error: r.error }

  revalidatePath('/app/settings')
  refreshWallet()
  return { success: true }
}

/** Look up a user by username for the Send modal recipient step. */
export async function lookupUser(
  username: string
): Promise<ActionResult<{ id: string; display_name: string; avatar_url: string | null }>> {
  const { profile } = await getCurrentUser()
  if (!profile) return { success: false, error: 'Unauthenticated' }

  const r = await wallet.lookupUser(profile, username)
  if (!r.ok) return { success: false, error: r.error }
  if (!r.user) return { success: false, error: 'User not found' }

  return {
    success: true,
    data: { id: r.user.id, display_name: r.user.displayName ?? '', avatar_url: r.user.avatarUrl },
  }
}
