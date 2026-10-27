/**
 * Convert a Supabase render/transform image URL to the plain public storage URL.
 *
 * Supabase stores uploaded images with render URLs like:
 *   https://<project>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?quality=70
 *
 * The render endpoint requires the storage bucket to have the transformation policy
 * enabled (paid feature / specific RLS). If it's not enabled, it returns 403.
 *
 * This helper converts it to the plain public URL:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * If the URL is already a plain URL or not a Supabase URL, it's returned unchanged.
 */
export function toPublicStorageUrl(url: string | null | undefined): string | null {
    if (!url) return null

    try {
        const parsed = new URL(url)

        // Only transform Supabase render URLs
        if (!parsed.hostname.endsWith('.supabase.co')) return url

        // /storage/v1/render/image/public/<rest> → /storage/v1/object/public/<rest>
        if (parsed.pathname.startsWith('/storage/v1/render/image/public/')) {
            const rest = parsed.pathname.slice('/storage/v1/render/image/public/'.length)
            return `${parsed.protocol}//${parsed.host}/storage/v1/object/public/${rest}`
        }

        return url
    } catch {
        return url
    }
}

/**
 * Whether a `next/image` `src` should skip Next's optimizer (`unoptimized`).
 *
 * True for:
 *  - anything that isn't a real http(s) URL — e.g. `palette:amber`, a sentinel
 *    some forms store in an image-url field to mean "no upload, render a
 *    solid-color placeholder instead" (see BusinessProfileModal.tsx). Passing
 *    those through the optimizer throws ("hostname \"\" is not configured"),
 *    since they don't have a real hostname to validate.
 *  - Supabase Storage URLs, since the render/transform endpoint needs a
 *    bucket policy that may not be enabled on this project (see
 *    toPublicStorageUrl above) — safer to leave those unoptimized.
 *
 * False (safe to optimize) for ordinary http(s) URLs elsewhere — Cloudinary
 * in practice, since that's where post/avatar uploads go.
 */
export function shouldSkipImageOptimization(url: string): boolean {
    try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true
        return parsed.hostname.endsWith('.supabase.co') || parsed.hostname.endsWith('.supabase.in')
    } catch {
        return true
    }
}
