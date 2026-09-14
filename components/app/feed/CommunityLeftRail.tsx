import { Briefcase, Cpu, Sprout, Palette, HeartPulse, Sparkles, Users } from 'lucide-react'

// No groups/communities table exists yet — these are shown to match the
// design but are inert ("Soon"), not fake-functional Join buttons.
const DISCOVER = [
    { icon: Briefcase, label: 'Entrepreneurs', tint: 'bg-primary/10 text-primary' },
    { icon: Cpu, label: 'Tech & Innovation', tint: 'bg-cyan/10 text-cyan' },
    { icon: Sprout, label: 'Agriculture', tint: 'bg-emerald/10 text-emerald' },
    { icon: Palette, label: 'Creative Hub', tint: 'bg-amber-500/10 text-amber-600' },
    { icon: HeartPulse, label: 'Health & Wellness', tint: 'bg-purple-500/10 text-purple-600' },
    { icon: Sparkles, label: 'Faith & Purpose', tint: 'bg-rose-500/10 text-rose-600' },
]

export default function CommunityLeftRail()
{
    return (
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-foreground">Discover Communities</h3>
                </div>
                <div className="space-y-1">
                    {DISCOVER.map((c) => (
                        <div key={c.label} className="flex items-center gap-2.5 py-1.5 opacity-70" title="Coming soon">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${c.tint}`}>
                                <c.icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium text-foreground flex-1 truncate">{c.label}</span>
                            <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">Soon</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-2">My Groups</h3>
                <div className="flex flex-col items-center text-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 opacity-30 mb-2" />
                    <p className="text-xs">Community groups aren&apos;t live yet.</p>
                </div>
            </div>
        </aside>
    )
}
