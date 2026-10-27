import { AsyncLocalStorage } from 'node:async_hooks'
import type { User } from '@/lib/types'

/*
 * Lets the mobile REST API (app/api/modushive) run the ModusHive server
 * actions as a bearer-token user. The routes verify the token, then call
 * actions inside runAsProfile(); requireProfile() in lib/actions/modushive.ts
 * picks the profile up from here before falling back to the cookie session.
 *
 * A browser-invoked server action never runs inside this store, so the
 * browser can't use it to act as someone else.
 */

const store = new AsyncLocalStorage<User>()

export function runAsProfile<T>(profile: User, fn: () => Promise<T>): Promise<T>
{
    return store.run(profile, fn)
}

export function getActingProfile(): User | undefined
{
    return store.getStore()
}
