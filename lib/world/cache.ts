/*
 * Tiny in-memory TTL cache for Hubnovo World data that rarely changes
 * (competition rows, pathways, missions, rubrics). Lives per server
 * instance; entries expire after `ms` and are dropped by
 * invalidateWorldCache() when content is synced. Failed loads aren't cached.
 */

const store = new Map<string, { at: number; ms: number; value: Promise<unknown> }>()

export function ttl<T>(key: string, ms: number, load: () => Promise<T>): Promise<T>
{
    const hit = store.get(key)
    if (hit && Date.now() - hit.at < hit.ms) return hit.value as Promise<T>
    const value = load()
    store.set(key, { at: Date.now(), ms, value })
    value.catch(() => store.delete(key))
    return value
}

export function invalidateWorldCache(prefix = '')
{
    for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k)
}

export const CONTENT_TTL_MS = 5 * 60 * 1000
