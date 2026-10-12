/**
 * ModusHive limits and constants. No server-only imports here — the upload
 * form imports this too so it can reject oversized files before uploading.
 *
 * Limits are the suggested defaults pending team sign-off.
 */
export type UserRole = 'user' | 'creator' | 'admin'

const MB = 1024 * 1024

export const UPLOAD_LIMITS: Record<UserRole, { maxDurationS: number; maxBytes: number }> = {
    user: { maxDurationS: 60, maxBytes: 100 * MB },
    creator: { maxDurationS: 10 * 60, maxBytes: 1024 * MB },
    admin: { maxDurationS: 10 * 60, maxBytes: 1024 * MB },
}

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']

/**
 * Mux's lowest encoding tier is 1080p, so the 720p cap is applied at
 * playback instead (baked into the signed token, so it can't be lifted
 * client-side).
 */
export const PLAYBACK_MAX_RESOLUTION = '720p'

export const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app'

export function normalizeRole(role: string | null | undefined): UserRole
{
    return role === 'admin' || role === 'creator' ? role : 'user'
}

export function getUploadLimits(role: string | null | undefined)
{
    return UPLOAD_LIMITS[normalizeRole(role)]
}

export function formatBytes(bytes: number): string
{
    if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toFixed(bytes % (1024 * MB) ? 1 : 0)} GB`
    return `${Math.round(bytes / MB)} MB`
}

export function formatDuration(totalSeconds: number | null | undefined): string
{
    if (!totalSeconds || totalSeconds < 0) return '0:00'
    const s = Math.round(totalSeconds)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, '0')
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}
