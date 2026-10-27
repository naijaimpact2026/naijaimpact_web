import { Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { UserBadge } from '@/lib/types'

/** Reads the new user_badges table for this profile. Graceful empty state — no mock badges. */
export default async function ProfileBadges({ userId }: { userId: string })
{
    const supabase = await createClient()
    const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })

    const badges = (data ?? []) as UserBadge[]

    // Cycle through the brand palette so badges read as varied, not monochrome.
    const BADGE_TINTS = [
        'bg-emerald/15 text-emerald',
        'bg-primary/15 text-primary',
        'bg-amber-500/15 text-amber-600',
        'bg-purple-500/15 text-purple-600',
    ]

    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">Your Badges</h3>
            {badges.length === 0 ? (
                <p className="text-xs text-muted-foreground">No badges yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge, i) => (
                        <div key={badge.id} className="flex flex-col items-center gap-1.5 rounded-xl bg-muted p-3 text-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${BADGE_TINTS[i % BADGE_TINTS.length]}`}>
                                <Award className="w-4 h-4" />
                            </div>
                            <p className="text-[11px] font-semibold text-foreground leading-tight">{badge.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
