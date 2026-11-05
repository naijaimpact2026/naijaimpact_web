import { Award, Gift, Lock, Zap } from 'lucide-react'
import { LEVELS } from '@/lib/competitions/config'

/** Level ladder + prize note. Prizes stay "announced soon" until legal sign-off. */
export default function RewardsHub({ xp, themeColor, prizeNote }: { xp: number; themeColor: string; prizeNote: string | null })
{
    return (
        <div className="space-y-3">
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {LEVELS.map((l) =>
                {
                    const unlocked = xp >= l.minXp
                    return (
                        <li key={l.level} className={`flex flex-col items-center gap-1 rounded-2xl p-2 text-center ${unlocked ? 'bg-card ring-1 ring-border' : 'bg-muted/50 opacity-60'}`}>
                            <span
                                className="flex h-9 w-9 items-center justify-center rounded-full"
                                style={unlocked ? { backgroundColor: `${themeColor}22`, color: themeColor } : undefined}
                            >
                                {unlocked ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                            </span>
                            <p className="text-[11px] font-bold leading-tight text-foreground">{l.name}</p>
                            <p className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground"><Zap className="h-2.5 w-2.5" />{l.minXp}</p>
                        </li>
                    )
                })}
            </ol>
            <p className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <Gift className="h-4 w-4 shrink-0" /> {prizeNote ?? 'Prizes will be announced soon.'}
            </p>
        </div>
    )
}
