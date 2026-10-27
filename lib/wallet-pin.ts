import { createServiceClient } from '@/lib/supabase/service'

/*
 * Wallet PIN, shared with the mobile app. The hash lives in public.credentials
 * (never readable by other users); checks go through the `pin_check` /
 * `pin_set` database functions, which enforce a lockout of 15 minutes after
 * 5 wrong attempts. users.wallet_pin is no longer used.
 */

export type PinResult = { ok: true } | { ok: false; error: string }

const LOCKED = 'Too many incorrect PIN attempts. Try again in 15 minutes.'

export async function hasWalletPin(userId: string): Promise<boolean> {
  const { data } = await createServiceClient().rpc('_unsafe_has_user_pin', { p_user_id: userId })
  return data === true
}

export async function checkWalletPin(userId: string, pin: string): Promise<PinResult> {
  const { data, error } = await createServiceClient().rpc('pin_check', { p_user_id: userId, p_pin: pin })
  if (error) return { ok: false, error: 'Could not verify your PIN. Please try again.' }
  switch (data) {
    case 'ok':
      return { ok: true }
    case 'no_pin':
      return { ok: false, error: 'You have not set a wallet PIN yet. Set one in Settings.' }
    case 'locked':
      return { ok: false, error: LOCKED }
    default:
      return { ok: false, error: 'Incorrect PIN.' }
  }
}

export async function setWalletPin(userId: string, newPin: string, currentPin?: string): Promise<PinResult> {
  if (!/^\d{4,6}$/.test(newPin)) return { ok: false, error: 'PIN must be 4 to 6 digits.' }
  const { data, error } = await createServiceClient().rpc('pin_set', {
    p_user_id: userId,
    p_new_pin: newPin,
    p_current_pin: currentPin ?? null,
  })
  if (error) return { ok: false, error: 'Failed to save PIN. Please try again.' }
  if (data === 'ok') return { ok: true }
  if (data === 'locked') return { ok: false, error: LOCKED }
  return { ok: false, error: currentPin ? 'Current PIN is incorrect.' : 'Please enter your current PIN to change it.' }
}
