import { createServiceClient } from '@/lib/supabase/service'
import { deleteObject, isR2Configured } from '@/lib/modushive/r2'

export interface CleanupResult {
    ok: boolean
    deletedCount: number
    deletedIds: string[]
    error?: string
}

/**
 * Purges abandoned video uploads: rows stuck in status='uploading'
 * older than maxAgeHours (default 24h) along with any partial R2 objects.
 */
export async function cleanupAbandonedUploads(maxAgeHours = 24): Promise<CleanupResult> {
    try {
        const supabase = createServiceClient()
        const threshold = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()

        const { data: abandoned, error } = await supabase
            .from('videos')
            .select('id, source_r2_key, created_at')
            .eq('status', 'uploading')
            .lt('created_at', threshold)

        if (error) {
            console.error('[modushive-cleanup] query failed:', error.message)
            return { ok: false, deletedCount: 0, deletedIds: [], error: error.message }
        }

        if (!abandoned || abandoned.length === 0) {
            return { ok: true, deletedCount: 0, deletedIds: [] }
        }

        const canDeleteR2 = isR2Configured()
        const deletedIds: string[] = []

        for (const video of abandoned) {
            if (video.source_r2_key && canDeleteR2) {
                await deleteObject(video.source_r2_key).catch((err) => {
                    console.warn(`[modushive-cleanup] failed to delete R2 object ${video.source_r2_key}:`, err)
                })
            }
            deletedIds.push(video.id)
        }

        const { error: deleteError } = await supabase
            .from('videos')
            .delete()
            .in('id', deletedIds)

        if (deleteError) {
            console.error('[modushive-cleanup] delete rows failed:', deleteError.message)
            return { ok: false, deletedCount: 0, deletedIds: [], error: deleteError.message }
        }

        console.log(`[modushive-cleanup] purged ${deletedIds.length} abandoned uploads older than ${maxAgeHours}h`)
        return { ok: true, deletedCount: deletedIds.length, deletedIds }
    } catch (err: any) {
        console.error('[modushive-cleanup] unhandled error:', err)
        return { ok: false, deletedCount: 0, deletedIds: [], error: err.message || 'Unknown error' }
    }
}
