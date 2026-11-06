/**
 * ModusHive limits and constants. No server-only imports here — the upload
 * form imports this too so it can reject oversized files before uploading.
 *
 * Limits are the suggested defaults pending team sign-off.
 */
export type UserRole = 'user' | 'creator' | 'admin'

const MB = 1024 * 1024

export const UPLOAD_LIMITS: Record<UserRole, { maxDurationS: number; maxBytes: number; maxDailyUploads: number }> = {
    user: { maxDurationS: 60, maxBytes: 100 * MB, maxDailyUploads: 5 },
    creator: { maxDurationS: 10 * 60, maxBytes: 1024 * MB, maxDailyUploads: 25 },
    admin: { maxDurationS: 10 * 60, maxBytes: 1024 * MB, maxDailyUploads: 100 },
}

/**
 * Who can go live. Restricted to active creators and admins.
 * Normal users can activate creator status via the Become a Creator flow.
 */
export const LIVE_STREAM_ROLES: UserRole[] = ['creator', 'admin']

/**
 * Live is the expensive part of Mux and Cloudflare, so cap it per role:
 * - maxDurationS: longest single broadcast
 * - maxOpenStreams: simultaneous active streams
 * - maxDailyMinutes: total live minutes allowed per 24-hour day
 * - allowRecording: whether to save stream as replay (disabled for 'user' to control costs)
 */
export const LIVE_LIMITS: Record<UserRole, {
    maxDurationS: number
    maxOpenStreams: number
    maxDailyMinutes: number
    allowRecording: boolean
}> = {
    user: {
        maxDurationS: 60 * 60,
        maxOpenStreams: 1,
        maxDailyMinutes: 60,
        allowRecording: true,
    },
    creator: {
        maxDurationS: 4 * 60 * 60,
        maxOpenStreams: 1,
        maxDailyMinutes: 240,
        allowRecording: true,
    },
    admin: {
        maxDurationS: 4 * 60 * 60,
        maxOpenStreams: 3,
        maxDailyMinutes: 720,
        allowRecording: true,
    },
}

export const ALLOWED_VIDEO_TYPES =['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']

/**
 * Mux's lowest encoding tier is 1080p, so the 720p cap is applied at
 * playback instead (baked into the signed token, so it can't be lifted
 * client-side).
 */
export const PLAYBACK_MAX_RESOLUTION = '720p'

export const MUX_RTMP_URL = 'rtmps://global-live.mux.com:443/app'

/** users.role is the `user_role` enum: user | creator | admin | super_admin. */
export function normalizeRole(role: string | null | undefined): UserRole
{
    if (role === 'admin' || role === 'super_admin') return 'admin'
    return role === 'creator' ? 'creator' : 'user'
}

export function isCreatorOrAdmin(role: string | null | undefined): boolean
{
    const r = normalizeRole(role)
    return r === 'creator' || r === 'admin'
}

export function getUploadLimits(role: string | null | undefined)
{
    return UPLOAD_LIMITS[normalizeRole(role)]
}

export function canGoLive(role: string | null | undefined): boolean
{
    return LIVE_STREAM_ROLES.includes(normalizeRole(role))
}

export function getLiveLimits(role: string | null | undefined)
{
    return LIVE_LIMITS[normalizeRole(role)]
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
