import Link from 'next/link'
import { BadgeCheck, Crown, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { LeaderboardEntry } from '@/lib/competitions/config'

interface Props
{
    entries: LeaderboardEntry[]
    meId?: string | null
    basePath: string
    states: string[]
    activeState: string | null
    showStateFilter: boolean
}

const PODIUM = ['text-amber-500', 'text-slate-400', 'text-orange-600']

export default function Leaderboard({ entries, meId, basePath, states, activeState, showStateFilter }: Props)
{
    return (
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Crown className="h-4 w-4 text-amber-500" /> Leaderboard</h2>
                {activeState && <span className="text-xs font-semibold text-muted-foreground">{activeState}</span>}
            </div>

            {showStateFilter && states.length > 0 && (
                <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                    <Link
                        href={basePath}
                        scroll={false}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${!activeState ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        Nigeria
                    </Link>
                    {states.map((s) => (
                        <Link
                            key={s}
                            href={`${basePath}?state=${encodeURIComponent(s)}`}
                            scroll={false}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${activeState === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                            {s}
                        </Link>
                    ))}
                </div>
            )}

            {entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No one on the board yet. Be the first!</p>
            ) : (
                <ol className="mt-3 max-h-[440px] space-y-1 overflow-y-auto overscroll-contain pr-1">
                    {entries.map((e) =>
                    {
                        const me = e.user_id === meId
                        const name = e.display_name ?? e.username ?? 'Hubnovo member'
                        return (
                            <li
                                key={e.user_id}
                                className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 ${me ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
                            >
                                <span className="w-6 shrink-0 text-center text-sm font-extrabold tabular-nums text-muted-foreground">
                                    {e.rank <= 3 ? <Medal className={`mx-auto h-5 w-5 ${PODIUM[e.rank - 1]}`} /> : e.rank}
                                </span>
                                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                                    <AvatarImage src={e.avatar_url ?? undefined} />
                                    <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                                        {e.username ? <Link href={`/app/profile/${e.username}`} className="truncate hover:underline">{name}</Link> : <span className="truncate">{name}</span>}
                                        {e.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                        {me && <span className="shrink-0 text-[10px] font-bold text-primary">(you)</span>}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {e.missions_completed} mission{e.missions_completed === 1 ? '' : 's'}{e.state ? ` · ${e.state}` : ''}
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm font-extrabold tabular-nums text-foreground">{e.xp.toLocaleString('en-NG')} <span className="text-[10px] font-bold text-muted-foreground">XP</span></span>
                            </li>
                        )
                    })}
                </ol>
            )}
        </div>
    )
}
