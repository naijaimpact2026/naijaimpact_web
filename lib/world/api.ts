import { NextResponse } from 'next/server'
import { jsonError, readJson, withProfile, type ApiContext } from '@/lib/modushive/api'

/*
 * REST plumbing for /api/competitions (web + mobile). Same response shape
 * as the ModusHive API: success → 200 { ok: true, ...fields };
 * failure → { error } with 400 / 401 / 403 / 404 / 429 / 500.
 */

export { jsonError, readJson, withProfile }
export type { ApiContext }

export function toResponse(result: { ok: true } | { ok: false; error: string }): Response
{
    if (result.ok) return NextResponse.json(result)
    const status = /not found/i.test(result.error) ? 404 : /^unauthorized$/i.test(result.error) ? 403 : 400
    return jsonError(result.error, status)
}

export const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
export const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
