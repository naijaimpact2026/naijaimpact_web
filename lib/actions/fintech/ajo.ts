'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AjoFrequency, Wallet } from '@/lib/types'

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

// ─── createAjoGroup ──────────────────────────────────────────────────────────

export interface CreateAjoGroupInput {
  name: string
  contribution_amount: number
  frequency: AjoFrequency
  member_limit: number
  start_date: string // ISO date string
}

export async function createAjoGroup(
  data: CreateAjoGroupInput
): Promise<ActionResult<{ groupId: string }>> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    // ── Validation ──────────────────────────────────────────────────────────
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Group name is required.' }
    }
    if (!data.contribution_amount || data.contribution_amount <= 0) {
      return { success: false, error: 'Contribution amount must be greater than 0.' }
    }
    if (!['weekly', 'biweekly', 'monthly'].includes(data.frequency)) {
      return { success: false, error: 'Frequency must be weekly, biweekly, or monthly.' }
    }
    if (data.member_limit < 2 || data.member_limit > 20) {
      return { success: false, error: 'Member limit must be between 2 and 20.' }
    }
    if (!data.start_date) {
      return { success: false, error: 'Start date is required.' }
    }
    const startDate = new Date(data.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startDate <= today) {
      return { success: false, error: 'Start date must be a future date.' }
    }

    // ── Insert group ─────────────────────────────────────────────────────────
    const { data: group, error: groupError } = await supabase
      .from('fintech_ajo_groups')
      .insert({
        creator_id: profile.id,
        name: data.name.trim(),
        contribution_amount: data.contribution_amount,
        frequency: data.frequency,
        member_limit: data.member_limit,
        start_date: data.start_date,
        status: 'active',
        current_cycle: 1,
        total_collected: 0,
      })
      .select('id')
      .single()

    if (groupError || !group) {
      console.error('[createAjoGroup] group insert error:', groupError)
      return { success: false, error: 'Failed to create group. Please try again.' }
    }

    // ── Auto-insert creator as first member ──────────────────────────────────
    const { error: memberError } = await supabase
      .from('fintech_ajo_members')
      .insert({
        group_id: group.id,
        user_id: profile.id,
        payout_position: 1,
        status: 'active',
      })

    if (memberError) {
      console.error('[createAjoGroup] member insert error:', memberError)
      // Clean up the group since membership failed
      await supabase.from('fintech_ajo_groups').delete().eq('id', group.id)
      return { success: false, error: 'Failed to set up group membership. Please try again.' }
    }

    revalidatePath('/app/fintech/ajo')

    return { success: true, data: { groupId: group.id } }
  } catch (err) {
    console.error('[createAjoGroup] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── joinAjoGroup ────────────────────────────────────────────────────────────

export async function joinAjoGroup(
  inviteToken: string
): Promise<ActionResult<{ groupId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!inviteToken || inviteToken.trim().length === 0) {
      return { success: false, error: 'Group ID or invite token is required.' }
    }

    const token = inviteToken.trim()

    // ── Fetch group ──────────────────────────────────────────────────────────
    const { data: group, error: groupError } = await supabase
      .from('fintech_ajo_groups')
      .select('id, status, member_limit')
      .eq('id', token)
      .maybeSingle()

    if (groupError) {
      console.error('[joinAjoGroup] group fetch error:', groupError)
      return { success: false, error: 'Failed to look up group. Please try again.' }
    }
    if (!group) {
      return { success: false, error: 'Group not found. Check the Group ID and try again.' }
    }
    if (group.status !== 'active') {
      return { success: false, error: 'This group is no longer accepting new members.' }
    }

    // ── Check member count ───────────────────────────────────────────────────
    const { count: memberCount, error: countError } = await supabase
      .from('fintech_ajo_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active')

    if (countError) {
      console.error('[joinAjoGroup] count error:', countError)
      return { success: false, error: 'Failed to check group capacity. Please try again.' }
    }

    if ((memberCount ?? 0) >= group.member_limit) {
      return { success: false, error: 'This group has reached its member limit.' }
    }

    // ── Check not already a member ───────────────────────────────────────────
    const { data: existing } = await supabase
      .from('fintech_ajo_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'You are already a member of this group.' }
    }

    // ── Find next payout_position ────────────────────────────────────────────
    const { data: positions } = await supabase
      .from('fintech_ajo_members')
      .select('payout_position')
      .eq('group_id', group.id)
      .order('payout_position', { ascending: false })
      .limit(1)

    const maxPosition = positions?.[0]?.payout_position ?? 0
    const nextPosition = maxPosition + 1

    // ── Insert member ────────────────────────────────────────────────────────
    const { error: memberError } = await supabase
      .from('fintech_ajo_members')
      .insert({
        group_id: group.id,
        user_id: profile.id,
        payout_position: nextPosition,
        status: 'active',
      })

    if (memberError) {
      console.error('[joinAjoGroup] member insert error:', memberError)
      return { success: false, error: 'Failed to join group. Please try again.' }
    }

    revalidatePath('/app/fintech/ajo')

    return { success: true, data: { groupId: group.id } }
  } catch (err) {
    console.error('[joinAjoGroup] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── contributeToAjo ─────────────────────────────────────────────────────────

export async function contributeToAjo(
  groupId: string,
  memberId: string,
  cycle: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    // ── Verify the calling user is the member ────────────────────────────────
    const { data: member, error: memberError } = await supabase
      .from('fintech_ajo_members')
      .select('id, user_id, payout_position, status')
      .eq('id', memberId)
      .maybeSingle()

    if (memberError || !member) {
      return { success: false, error: 'Member record not found.' }
    }
    if (member.user_id !== profile.id) {
      return { success: false, error: 'Unauthorised: you are not this member.' }
    }
    if (member.status !== 'active') {
      return { success: false, error: 'Your membership is not active.' }
    }

    // ── Fetch group ──────────────────────────────────────────────────────────
    const { data: group, error: groupError } = await supabase
      .from('fintech_ajo_groups')
      .select('id, contribution_amount, total_collected, current_cycle, status, member_limit')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Group not found.' }
    }
    if (group.status !== 'active') {
      return { success: false, error: 'This group is no longer active.' }
    }

    const { contribution_amount } = group

    // ── Check for duplicate contribution ─────────────────────────────────────
    const { data: existingContribution } = await supabase
      .from('fintech_ajo_contributions')
      .select('id')
      .eq('group_id', groupId)
      .eq('member_id', memberId)
      .eq('cycle', cycle)
      .eq('status', 'paid')
      .maybeSingle()

    if (existingContribution) {
      return { success: false, error: 'You have already contributed for this cycle.' }
    }

    // ── Check wallet balance ──────────────────────────────────────────────────
    const wallet = await getOrCreateWallet(supabase, profile.id)
    if (wallet.balance < contribution_amount) {
      return { success: false, error: 'Insufficient wallet balance.' }
    }

    // ── Debit the member's wallet ─────────────────────────────────────────────
    const { error: debitError } = await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - contribution_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('[contributeToAjo] debit error:', debitError)
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    // ── Insert contribution row ───────────────────────────────────────────────
    const { error: contribError } = await supabase
      .from('fintech_ajo_contributions')
      .insert({
        group_id: groupId,
        member_id: memberId,
        cycle,
        amount: contribution_amount,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })

    if (contribError) {
      console.error('[contributeToAjo] contribution insert error:', contribError)
      // Rollback wallet debit
      await supabase
        .from('wallet')
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
      return { success: false, error: 'Failed to record contribution. Please try again.' }
    }

    // ── Update group's total_collected ────────────────────────────────────────
    const { error: groupUpdateError } = await supabase
      .from('fintech_ajo_groups')
      .update({
        total_collected: group.total_collected + contribution_amount,
      })
      .eq('id', groupId)

    if (groupUpdateError) {
      console.error('[contributeToAjo] group update error:', groupUpdateError)
    }

    // ── Insert ajo_contribution transaction for contributing member ───────────
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'ajo_contribution',
      amount: contribution_amount,
      status: 'success',
      reference_id: groupId,
      description: `Ajo contribution — cycle ${cycle}`,
    })

    // ── Check if ALL members have paid for this cycle ─────────────────────────
    const { data: allMembers, error: allMembersError } = await supabase
      .from('fintech_ajo_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('status', 'active')

    if (!allMembersError && allMembers && allMembers.length > 0) {
      const memberIds = allMembers.map((m: { id: string }) => m.id)

      const { count: paidCount } = await supabase
        .from('fintech_ajo_contributions')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('cycle', cycle)
        .eq('status', 'paid')
        .in('member_id', memberIds)

      const allPaid = (paidCount ?? 0) >= memberIds.length

      if (allPaid) {
        const memberCount = memberIds.length
        const payoutAmount = contribution_amount * memberCount

        // ── Find payout recipient ─────────────────────────────────────────────
        // First try fintech_ajo_payout_schedule, fall back to payout_position = cycle
        let recipientUserId: string | null = null

        const { data: schedule } = await supabase
          .from('fintech_ajo_payout_schedule')
          .select('recipient_id')
          .eq('group_id', groupId)
          .eq('cycle', cycle)
          .eq('status', 'pending')
          .maybeSingle()

        if (schedule?.recipient_id) {
          recipientUserId = schedule.recipient_id
        } else {
          // Fall back: find the member whose payout_position = cycle
          const { data: recipientMember } = await supabase
            .from('fintech_ajo_members')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('payout_position', cycle)
            .eq('status', 'active')
            .maybeSingle()

          recipientUserId = recipientMember?.user_id ?? null
        }

        if (recipientUserId) {
          // ── Credit recipient wallet ─────────────────────────────────────────
          const recipientWallet = await getOrCreateWallet(supabase, recipientUserId)

          await supabase
            .from('wallet')
            .update({
              balance: recipientWallet.balance + payoutAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', recipientWallet.id)

          // ── Insert ajo_payout transaction for recipient ──────────────────────
          await supabase.from('transactions').insert({
            user_id: recipientUserId,
            type: 'ajo_payout',
            amount: payoutAmount,
            status: 'success',
            reference_id: groupId,
            description: `Ajo payout — cycle ${cycle}`,
          })

          // ── Mark payout schedule as paid if it exists ────────────────────────
          if (schedule?.recipient_id) {
            await supabase
              .from('fintech_ajo_payout_schedule')
              .update({ paid_at: new Date().toISOString(), status: 'paid' })
              .eq('group_id', groupId)
              .eq('cycle', cycle)
          }

          // ── Insert notification for recipient ────────────────────────────────
          await supabase.from('notifications').insert({
            recipient_id: recipientUserId,
            actor_id: null,
            type: 'ajo_payout',
            reference_id: groupId,
            read: false,
          })
        }

        // ── Increment group's current_cycle ──────────────────────────────────
        await supabase
          .from('fintech_ajo_groups')
          .update({ current_cycle: group.current_cycle + 1 })
          .eq('id', groupId)
      }
    }

    revalidatePath('/app/fintech/ajo')

    return { success: true }
  } catch (err) {
    console.error('[contributeToAjo] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── raiseDispute ────────────────────────────────────────────────────────────

export async function raiseDispute(
  groupId: string,
  description: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!description || description.trim().length === 0) {
      return { success: false, error: 'Dispute description is required.' }
    }
    if (description.trim().length > 1000) {
      return { success: false, error: 'Description must be 1000 characters or fewer.' }
    }

    // ── Verify the calling user is a member of the group ─────────────────────
    const { data: membership } = await supabase
      .from('fintech_ajo_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (!membership) {
      return { success: false, error: 'You must be a member of this group to raise a dispute.' }
    }

    // ── Insert dispute row ────────────────────────────────────────────────────
    const { error: disputeError } = await supabase
      .from('fintech_ajo_disputes')
      .insert({
        group_id: groupId,
        raised_by: profile.id,
        description: description.trim(),
        status: 'open',
      })

    if (disputeError) {
      console.error('[raiseDispute] insert error:', disputeError)
      return { success: false, error: 'Failed to raise dispute. Please try again.' }
    }

    // ── Notify all group members ──────────────────────────────────────────────
    const { data: members, error: membersError } = await supabase
      .from('fintech_ajo_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')

    if (!membersError && members && members.length > 0) {
      const notifications = members.map((m: { user_id: string }) => ({
        recipient_id: m.user_id,
        actor_id: profile.id,
        type: 'dispute_raised' as const,
        reference_id: groupId,
        read: false,
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.error('[raiseDispute] notification insert error:', notifError)
        // Non-fatal — log but continue
      }
    }

    revalidatePath('/app/fintech/ajo')

    return { success: true }
  } catch (err) {
    console.error('[raiseDispute] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
