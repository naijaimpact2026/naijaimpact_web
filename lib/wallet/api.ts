import { NextResponse } from 'next/server'
import { jsonError, readJson, withProfile, type ApiContext } from '@/lib/modushive/api'
import type { WalletResult } from './service'

/*
 * REST plumbing for the wallet API (app/api/wallet, app/api/banks,
 * app/api/users/lookup), used by the mobile app with
 * `Authorization: Bearer <supabase access token>`.
 * Success → 200 with the documented fields; failure → { error } with
 * 400 / 401 / 403 / 404 / 429 / 503.
 */

export { jsonError, readJson, withProfile }
export type { ApiContext }

/** Turns a wallet result into a response, dropping the internal `ok` flag. */
export function toResponse<T extends object>(result: WalletResult<T>, pick?: (r: T) => object): Response
{
    if (!result.ok) return jsonError(result.error, result.status)
    const { ok: _ok, ...fields } = result as { ok: true } & T
    return NextResponse.json(pick ? pick(fields as unknown as T) : fields)
}

/** The signed-in user's email (deposits must be paid from it). */
export const emailOf = ({ authUser, profile }: ApiContext) => String(authUser?.email ?? profile.email ?? '').trim()

export const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '')
export const num = (v: unknown) =>
    typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN

export const badBody = () => jsonError('Send a JSON body.', 400)
