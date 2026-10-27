/**
 * Thin wrapper over the Vibration API. Only Android Chrome/Firefox implement
 * `navigator.vibrate` — iOS Safari has no web haptics API at all, so this is
 * a no-op there (and in any non-browser context). Callers don't need to
 * feature-detect themselves.
 */
export type HapticPattern = 'success' | 'error' | 'warning' | 'info' | 'light'

const PATTERNS: Record<HapticPattern, number | number[]> = {
    success: [15],
    info: [10],
    warning: [15, 60, 15],
    error: [20, 80, 20, 80, 20],
    light: [8],
}

export function triggerHaptic(pattern: HapticPattern): void
{
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return

    try { navigator.vibrate(PATTERNS[pattern]) } catch { /* some browsers throw outside a user gesture — safe to ignore */ }
}
