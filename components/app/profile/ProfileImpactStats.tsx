import { Users2, GraduationCap, Briefcase, Building2 } from 'lucide-react'
import type { User } from '@/lib/types'

interface ProfileImpactStatsProps
{
    profile: User
    isOwnProfile: boolean
}

/** "Your Impact" stat grid — new users.people_reached/people_trained/jobs_created/
 *  communities_impacted columns, default 0. No fabricated numbers. */
export default function ProfileImpactStats({ profile, isOwnProfile }: ProfileImpactStatsProps)
{
    const stats = [
        { icon: Users2, label: 'People Reached', value: profile.people_reached, tint: 'bg-emerald/10 text-emerald' },
        { icon: GraduationCap, label: 'Trained', value: profile.people_trained, tint: 'bg-primary/10 text-primary' },
        { icon: Briefcase, label: 'Jobs Created', value: profile.jobs_created, tint: 'bg-purple-500/10 text-purple-600' },
        { icon: Building2, label: 'Communities', value: profile.communities_impacted, tint: 'bg-amber-500/10 text-amber-600' },
    ]

    const allZero = stats.every((s) => s.value === 0)

    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">Your Impact</h3>
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-3 text-center ${stat.tint.split(' ')[0]}`}>
                        <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.tint.split(' ')[1]}`} />
                        <p className="text-base font-bold text-foreground leading-none">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
            {allZero && isOwnProfile && (
                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                    Impact isn&apos;t tracked yet — it&apos;ll show up here as you get active.
                </p>
            )}
        </div>
    )
}
