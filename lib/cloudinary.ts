// lib/cloudinary.ts
// Cloudinary configuration and signed upload helper.
// ⚠️  This module must ONLY be imported in server-side code (API routes, Server Actions).
//    Never import it in Client Components — it exposes CLOUDINARY_API_SECRET.

import crypto from 'crypto'

export const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  ''
export const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY ||
  process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
  ''
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''

/**
 * Generates a signed upload signature for Cloudinary.
 * Params must not include `api_key`, `resource_type`, or `file` — Cloudinary excludes those.
 *
 * @param params  Upload params to include in the signature (e.g. folder, resource_type)
 * @returns       Signature, timestamp, apiKey and cloudName ready to attach to a FormData upload
 */
export function signUpload(params: Record<string, string | number>): {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
} {
  const timestamp = Math.round(Date.now() / 1000)

  // Build the string-to-sign: sort keys alphabetically, join as key=value pairs, then
  // append the API secret (no separator) as Cloudinary requires.
  const paramString = Object.keys({ ...params, timestamp })
    .sort()
    .map((key) => `${key}=${({ ...params, timestamp } as Record<string, string | number>)[key]}`)
    .join('&')

  const signature = crypto
    .createHash('sha1')
    .update(paramString + CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
  }
}
