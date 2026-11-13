/** Client-safe report reasons and input shape (server logic: reports.ts). */

export type ReportReason = 'spam' | 'abuse' | 'cheating' | 'personal_info' | 'other'
export type ReportStatus = 'open' | 'actioned' | 'dismissed'
export const REPORT_REASONS: { id: ReportReason; label: string; hint: string }[] = [
    { id: 'cheating', label: 'Cheating', hint: 'Copied work, fake evidence, gaming the scores' },
    { id: 'abuse', label: 'Abuse or bullying', hint: 'Harassment, hate, threats' },
    { id: 'spam', label: 'Spam', hint: 'Ads, links, nonsense' },
    { id: 'personal_info', label: 'Personal info', hint: 'Sharing someone’s phone, address or private details' },
    { id: 'other', label: 'Something else', hint: 'Tell us in the note' },
]

export interface ReportInput
{
    targetUserId: string
    reason: ReportReason
    note?: string | null
    attemptId?: string | null
    context?: 'leaderboard' | 'squad' | 'attempt' | 'other'
}
