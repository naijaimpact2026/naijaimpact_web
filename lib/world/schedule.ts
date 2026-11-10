import { STAGE_WEEKS, type SemesterClock } from './types'

/*
 * 16-week mission scheduler. Semesters start on a Monday at 00:00 Lagos
 * time (UTC+01:00, no daylight saving). Day 1 = Monday … day 7 = Sunday.
 * Times are computed from the start date, never from the server's clock
 * zone (Vercel runs in UTC).
 */

const DAY_MS = 24 * 60 * 60 * 1000

export function stageOfWeek(week: number) { return Math.ceil(week / STAGE_WEEKS) }

/** When a mission opens. */
export function unlockAt(seasonStart: string, week: number, day: number): Date
{
    return new Date(new Date(seasonStart).getTime() + ((week - 1) * 7 + (day - 1)) * DAY_MS)
}

export function semesterClock(seasonStart: string | null, seasonEnd: string | null, weeks: number, now = Date.now()): SemesterClock
{
    if (!seasonStart) return { week: null, day: null, stage: null, startsAt: null, endsAt: seasonEnd, phase: 'upcoming' }
    const start = new Date(seasonStart).getTime()
    const end = seasonEnd ? new Date(seasonEnd).getTime() : start + weeks * 7 * DAY_MS
    if (now < start) return { week: null, day: null, stage: null, startsAt: seasonStart, endsAt: seasonEnd, phase: 'upcoming' }
    if (now > end) return { week: null, day: null, stage: null, startsAt: seasonStart, endsAt: seasonEnd, phase: 'ended' }
    const days = Math.floor((now - start) / DAY_MS)
    const week = Math.min(weeks, Math.floor(days / 7) + 1)
    const day = (days % 7) + 1
    return { week, day, stage: stageOfWeek(week), startsAt: seasonStart, endsAt: seasonEnd, phase: 'running' }
}
