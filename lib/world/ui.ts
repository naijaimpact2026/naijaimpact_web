import
{
    Brain, CheckCircle2, ClipboardList, Clock, Crown, FileUp, Hourglass, LayoutGrid, Lightbulb, ListChecks, Lock,
    MessageSquareText, PenLine, Radio, RotateCcw, Shuffle, Swords, Users, Video, XCircle, type LucideIcon,
} from 'lucide-react'
import type { MissionKind, MissionStatus, ReviewMode } from './types'

/** Client-safe display metadata for Hubnovo World. */

export const KIND_META: Record<MissionKind, { label: string; icon: LucideIcon }> = {
    quiz: { label: 'Quiz', icon: ListChecks },
    sort: { label: 'Sort game', icon: Shuffle },
    scenario: { label: 'Scenario', icon: Brain },
    board: { label: 'Board', icon: LayoutGrid },
    canvas: { label: 'Canvas', icon: Lightbulb },
    evidence: { label: 'Real-world mission', icon: FileUp },
    video: { label: 'Video', icon: Video },
    reflection: { label: 'Reflection', icon: PenLine },
    team: { label: 'Squad mission', icon: Users },
    live_event: { label: 'Live event', icon: Radio },
    boss: { label: 'Boss challenge', icon: Swords },
}

export const STATUS_META: Record<MissionStatus, { label: string; icon: LucideIcon; tone: string }> = {
    locked: { label: 'Locked', icon: Lock, tone: 'text-muted-foreground bg-muted' },
    available: { label: 'Ready', icon: ClipboardList, tone: 'text-primary bg-primary/10' },
    in_review: { label: 'In review', icon: Hourglass, tone: 'text-sky-700 bg-sky-500/15 dark:text-sky-300' },
    passed: { label: 'Done', icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-500/15 dark:text-emerald-300' },
    needs_revision: { label: 'Try again', icon: RotateCcw, tone: 'text-amber-700 bg-amber-500/15 dark:text-amber-300' },
    rejected: { label: 'Not accepted', icon: XCircle, tone: 'text-red-700 bg-red-500/15 dark:text-red-300' },
}

export const REVIEW_META: Record<ReviewMode, { label: string; icon: LucideIcon }> = {
    auto: { label: 'Instant result', icon: CheckCircle2 },
    ai: { label: 'Instant AI feedback', icon: MessageSquareText },
    human: { label: 'Scored by judges', icon: Crown },
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export function formatUnlock(iso: string)
{
    return new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' })
}

export { Clock }
