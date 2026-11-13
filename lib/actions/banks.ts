'use server'

// Web server actions for the bank directory and NUBAN resolution. Thin
// wrappers over lib/wallet (shared with the mobile REST API, app/api/banks).
// Each export is a public endpoint, so each requires a signed-in user.

import { getCurrentUser } from '@/lib/supabase/auth'
import * as wallet from '@/lib/wallet/service'
import type { Bank, BankResolveResult } from '@/lib/wallet/banks'

export type { Bank, BankResolveResult }

/** Nigerian banks from Paystack, popular banks first (cached 24h). */
export async function fetchNigerianBanks(): Promise<Bank[]> {
  const { profile } = await getCurrentUser()
  if (!profile) return []
  return wallet.listBanks()
}

/** Resolve a 10-digit NUBAN against a bank code to the account holder's name. */
export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<BankResolveResult> {
  const { profile } = await getCurrentUser()
  if (!profile) return { success: false, error: 'Please sign in again.' }

  const r = await wallet.resolveBankAccount(profile, bankCode, accountNumber)
  if (!r.ok) return { success: false, error: r.error }
  return { success: true, accountName: r.accountName, accountNumber: r.accountNumber, bankCode: r.bankCode }
}
