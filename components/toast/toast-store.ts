/**
 * Framework-agnostic toast state machine. A module-level singleton (not a
 * React context) so `toast.success(...)` can be called from anywhere —
 * server action callbacks, event handlers, deep in the tree — without
 * threading a hook through. ToastViewport subscribes via useSyncExternalStore,
 * which is why every mutation below replaces the array/item rather than
 * mutating in place — getSnapshot() must return a stable reference when
 * nothing changed and a new one when something did.
 *
 * Lifecycle: addToast -> (visible | queued) -> requestDismiss (marks
 * `leaving`, keeps rendering for EXIT_DURATION so ToastCard can play its
 * exit animation) -> remove (actually spliced out, frees a slot for the
 * queue). Only up to MAX_VISIBLE are ever in `toasts`; the rest wait in
 * `queue` and get unshifted in — same as a brand new toast — as slots free.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem
{
    id: string
    type: ToastType
    message: string
    createdAt: number
    /** ms until auto-dismiss, or null to stay indefinitely (unacknowledged error). */
    duration: number | null
    /** ms left, tracked across pause/resume so a hover doesn't lose progress. */
    remaining: number
    pausedAt: number | null
    /** Error toasts only — set once the user clicks the body, which starts the 10s exit countdown. */
    acknowledged: boolean
    leaving: boolean
    exitDirection: 'left' | 'right' | null
}

type Listener = () => void

export const MAX_VISIBLE = 3
export const EXIT_DURATION = 220
const ERROR_ACK_DURATION = 10_000

const DURATIONS: Record<ToastType, number | null> = {
    info: 4_000,
    success: 5_000,
    warning: 7_000,
    error: null,
}

let toasts: ToastItem[] = []
let queue: ToastItem[] = []
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const listeners = new Set<Listener>()

function emit()
{
    listeners.forEach((listener) => listener())
}

function clearTimer(id: string)
{
    const existing = timers.get(id)
    if (existing)
    {
        clearTimeout(existing)
        timers.delete(id)
    }
}

function scheduleTimer(item: ToastItem)
{
    clearTimer(item.id)
    if (item.duration == null) return
    timers.set(item.id, setTimeout(() => requestDismiss(item.id), item.duration))
}

/** Replaces a single item (in whichever list holds it) with an updated copy, then notifies. */
function patch(id: string, updater: (item: ToastItem) => ToastItem)
{
    let touched = false

    toasts = toasts.map((t) =>
    {
        if (t.id !== id) return t
        touched = true
        return updater(t)
    })

    if (!touched)
    {
        queue = queue.map((t) => (t.id === id ? updater(t) : t))
    }

    emit()
}

function promote()
{
    while (toasts.length < MAX_VISIBLE && queue.length > 0)
    {
        const next = { ...queue[0], createdAt: Date.now() }
        queue = queue.slice(1)
        toasts = [next, ...toasts]
        scheduleTimer(next)
    }
    emit()
}

function remove(id: string)
{
    clearTimer(id)
    const wasVisible = toasts.some((t) => t.id === id)
    toasts = toasts.filter((t) => t.id !== id)
    queue = queue.filter((t) => t.id !== id)
    if (wasVisible) promote()
    else emit()
}

export function addToast(type: ToastType, message: string): string
{
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const duration = DURATIONS[type]
    const item: ToastItem = {
        id,
        type,
        message,
        createdAt: Date.now(),
        duration,
        remaining: duration ?? Number.POSITIVE_INFINITY,
        pausedAt: null,
        acknowledged: false,
        leaving: false,
        exitDirection: null,
    }

    if (toasts.length < MAX_VISIBLE)
    {
        toasts = [item, ...toasts]
        scheduleTimer(item)
    }
    else
    {
        queue = [...queue, item]
    }

    emit()
    return id
}

/** Public "close this" entrypoint — X click, swipe past threshold, or a timer firing. Plays the exit animation before actually removing it. */
export function requestDismiss(id: string, direction: 'left' | 'right' | null = null)
{
    const item = toasts.find((t) => t.id === id) ?? queue.find((t) => t.id === id)
    if (!item || item.leaving) return

    clearTimer(id)
    patch(id, (t) => ({ ...t, leaving: true, exitDirection: direction }))
    setTimeout(() => remove(id), EXIT_DURATION)
}

export function pause(id: string)
{
    const item = toasts.find((t) => t.id === id)
    if (!item || item.leaving || item.duration == null || item.pausedAt != null) return

    clearTimer(id)
    patch(id, (t) => ({ ...t, pausedAt: Date.now() }))
}

export function resume(id: string)
{
    const item = toasts.find((t) => t.id === id)
    if (!item || item.leaving || item.duration == null || item.pausedAt == null) return

    const elapsedSincePause = item.pausedAt - item.createdAt
    const remaining = Math.max(item.remaining - elapsedSincePause, 0)
    const updated: ToastItem = { ...item, remaining, duration: remaining, createdAt: Date.now(), pausedAt: null }
    patch(id, () => updated)
    scheduleTimer(updated)
}

/** Error toasts don't start their exit countdown until the user acknowledges (clicks) them. */
export function acknowledge(id: string)
{
    const item = toasts.find((t) => t.id === id)
    if (!item || item.leaving || item.type !== 'error' || item.acknowledged) return

    const updated: ToastItem = {
        ...item,
        acknowledged: true,
        duration: ERROR_ACK_DURATION,
        remaining: ERROR_ACK_DURATION,
        createdAt: Date.now(),
        pausedAt: null,
    }
    patch(id, () => updated)
    scheduleTimer(updated)
}

export function subscribe(listener: Listener): () => void
{
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function getSnapshot(): ToastItem[]
{
    return toasts
}
