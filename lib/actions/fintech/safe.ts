'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Wallet } from '@/lib/types'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Resolve the platform users.id from the auth session. */
async function resolveProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
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

  return { authUser: user, profile }
}

/** Get or create the wallet row for a given users.id. */
async function getOrCreateWallet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Wallet> {
  const { data: wallet } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (wallet) return wallet as Wallet

  const { data: created, error } = await supabase
    .from('wallet')
    .insert({ user_id: userId, balance: 0 })
    .select('*')
    .single()

  if (error || !created) throw new Error('Failed to create wallet')
  return created as Wallet
}

// ─── createFlexibleAccount ───────────────────────────────────────────────────

export async function createFlexibleAccount(
  name: string
): Promise<ActionResult<{ accountId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Account name is required.' }
    }
    if (name.trim().length > 100) {
      return { success: false, error: 'Account name must be 100 characters or fewer.' }
    }

    const { data: account, error } = await supabase
      .from('fintech_safe_flexible_accounts')
      .insert({
        user_id: profile.id,
        name: name.trim(),
        balance: 0,
      })
      .select('id')
      .single()

    if (error || !account) {
      console.error('[createFlexibleAccount] insert error:', error)
      return { success: false, error: 'Failed to create account. Please try again.' }
    }

    revalidatePath('/app/fintech/safe')
    return { success: true, data: { accountId: account.id } }
  } catch (err) {
    console.error('[createFlexibleAccount] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── topUpSavings ────────────────────────────────────────────────────────────

export async function topUpSavings(
  accountId: string,
  amount: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!amount || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0.' }
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from('fintech_safe_flexible_accounts')
      .select('id, balance, name')
      .eq('id', accountId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (accountError || !account) {
      return { success: false, error: 'Account not found.' }
    }

    // Check wallet balance
    const wallet = await getOrCreateWallet(supabase, profile.id)
    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient wallet balance.' }
    }

    // Debit wallet
    const { error: debitError } = await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('[topUpSavings] debit error:', debitError)
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    // Credit savings account
    const { error: creditError } = await supabase
      .from('fintech_safe_flexible_accounts')
      .update({
        balance: account.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    if (creditError) {
      console.error('[topUpSavings] credit error:', creditError)
      // Rollback wallet
      await supabase
        .from('wallet')
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
      return { success: false, error: 'Failed to top up savings. Please try again.' }
    }

    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'savings_topup',
      amount,
      status: 'success',
      reference_id: accountId,
      description: `Top-up: ${account.name}`,
    })

    revalidatePath('/app/fintech/safe')
    return { success: true }
  } catch (err) {
    console.error('[topUpSavings] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── withdrawSavings ─────────────────────────────────────────────────────────

export async function withdrawSavings(
  accountId: string,
  amount: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!amount || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0.' }
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from('fintech_safe_flexible_accounts')
      .select('id, balance, name')
      .eq('id', accountId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (accountError || !account) {
      return { success: false, error: 'Account not found.' }
    }

    if (account.balance < amount) {
      return { success: false, error: 'Insufficient savings balance.' }
    }

    // Debit savings account
    const { error: debitError } = await supabase
      .from('fintech_safe_flexible_accounts')
      .update({
        balance: account.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    if (debitError) {
      console.error('[withdrawSavings] debit error:', debitError)
      return { success: false, error: 'Withdrawal failed. Please try again.' }
    }

    // Credit wallet
    const wallet = await getOrCreateWallet(supabase, profile.id)
    await supabase
      .from('wallet')
      .update({
        balance: wallet.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'savings_withdrawal',
      amount,
      status: 'success',
      reference_id: accountId,
      description: `Withdrawal: ${account.name}`,
    })

    revalidatePath('/app/fintech/safe')
    return { success: true }
  } catch (err) {
    console.error('[withdrawSavings] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── createLockedSavings ─────────────────────────────────────────────────────

export interface CreateLockedSavingsInput {
  name: string
  amount: number
  lock_until: string  // ISO date string
  interest_rate: number
}

export async function createLockedSavings(
  data: CreateLockedSavingsInput
): Promise<ActionResult<{ savingsId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Name is required.' }
    }
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0.' }
    }
    if (!data.lock_until) {
      return { success: false, error: 'Lock-until date is required.' }
    }
    const lockDate = new Date(data.lock_until)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (lockDate <= today) {
      return { success: false, error: 'Lock-until date must be a future date.' }
    }
    if (data.interest_rate < 0 || data.interest_rate > 100) {
      return { success: false, error: 'Interest rate must be between 0 and 100.' }
    }

    // Check wallet balance
    const wallet = await getOrCreateWallet(supabase, profile.id)
    if (wallet.balance < data.amount) {
      return { success: false, error: 'Insufficient wallet balance.' }
    }

    // Debit wallet
    const { error: debitError } = await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - data.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('[createLockedSavings] debit error:', debitError)
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    // Insert locked savings row
    const { data: savings, error: insertError } = await supabase
      .from('fintech_safe_locked_savings')
      .insert({
        user_id: profile.id,
        name: data.name.trim(),
        amount: data.amount,
        lock_until: data.lock_until,
        interest_rate: data.interest_rate,
        status: 'locked',
      })
      .select('id')
      .single()

    if (insertError || !savings) {
      console.error('[createLockedSavings] insert error:', insertError)
      // Rollback wallet
      await supabase
        .from('wallet')
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
      return { success: false, error: 'Failed to create locked savings. Please try again.' }
    }

    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'savings_topup',
      amount: data.amount,
      status: 'success',
      reference_id: savings.id,
      description: `Locked savings created: ${data.name.trim()}`,
    })

    revalidatePath('/app/fintech/safe')
    return { success: true, data: { savingsId: savings.id } }
  } catch (err) {
    console.error('[createLockedSavings] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── createGoalSavings ───────────────────────────────────────────────────────

export interface CreateGoalSavingsInput {
  name: string
  target_amount: number
  target_date?: string | null
}

export async function createGoalSavings(
  data: CreateGoalSavingsInput
): Promise<ActionResult<{ goalId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Goal name is required.' }
    }
    if (!data.target_amount || data.target_amount <= 0) {
      return { success: false, error: 'Target amount must be greater than 0.' }
    }
    if (data.target_date) {
      const targetDate = new Date(data.target_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (targetDate <= today) {
        return { success: false, error: 'Target date must be a future date.' }
      }
    }

    const { data: goal, error: insertError } = await supabase
      .from('fintech_safe_goal_savings')
      .insert({
        user_id: profile.id,
        name: data.name.trim(),
        target_amount: data.target_amount,
        current_amount: 0,
        target_date: data.target_date ?? null,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError || !goal) {
      console.error('[createGoalSavings] insert error:', insertError)
      return { success: false, error: 'Failed to create goal. Please try again.' }
    }

    revalidatePath('/app/fintech/safe')
    return { success: true, data: { goalId: goal.id } }
  } catch (err) {
    console.error('[createGoalSavings] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── contributeToGoal ────────────────────────────────────────────────────────

export async function contributeToGoal(
  goalId: string,
  amount: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!amount || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0.' }
    }

    // Verify goal ownership
    const { data: goal, error: goalError } = await supabase
      .from('fintech_safe_goal_savings')
      .select('id, name, target_amount, current_amount, status')
      .eq('id', goalId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (goalError || !goal) {
      return { success: false, error: 'Goal not found.' }
    }
    if (goal.status === 'achieved') {
      return { success: false, error: 'This goal has already been achieved.' }
    }
    if (goal.status === 'cancelled') {
      return { success: false, error: 'This goal has been cancelled.' }
    }

    // Check wallet balance
    const wallet = await getOrCreateWallet(supabase, profile.id)
    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient wallet balance.' }
    }

    // Debit wallet
    const { error: debitError } = await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('[contributeToGoal] debit error:', debitError)
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    const newAmount = goal.current_amount + amount
    const achieved = newAmount >= goal.target_amount

    // Update goal
    const { error: updateError } = await supabase
      .from('fintech_safe_goal_savings')
      .update({
        current_amount: newAmount,
        status: achieved ? 'achieved' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)

    if (updateError) {
      console.error('[contributeToGoal] update error:', updateError)
      // Rollback wallet
      await supabase
        .from('wallet')
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
      return { success: false, error: 'Failed to record contribution. Please try again.' }
    }

    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'savings_topup',
      amount,
      status: 'success',
      reference_id: goalId,
      description: `Goal contribution: ${goal.name}`,
    })

    // If goal achieved, insert notification
    if (achieved) {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        actor_id: null,
        type: 'goal_achieved',
        reference_id: goalId,
        read: false,
      })
    }

    revalidatePath('/app/fintech/safe')
    return { success: true }
  } catch (err) {
    console.error('[contributeToGoal] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
