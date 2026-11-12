import Link from 'next/link'
import { ArrowRight, Box, MapPin } from 'lucide-react'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { DISTRICTS, districtProgress, type DistrictKey, type WorldMissionLite } from '@/lib/world/districts'

/*
 * The doorway to the 3D Campus, shown near the top of the Campus home: an
 * illustrated skyline with each district pinned and its progress this week,
 * so players can see what's inside before the 3D world loads.
 */

// Pin positions over the skyline (percent of the scene box).
const PIN: Record<DistrictKey, { left: string; top: string }> = {
    learning_academy: { left: '13%', top: '30%' },
    career_district: { left: '34%', top: '10%' },
    rewards_exchange: { left: '52%', top: '44%' },
    competition_arena: { left: '70%', top: '22%' },
    enterprise_hub: { left: '88%', top: '38%' },
}

export default function WorldEntryCard({ href, color, character, missions, myDistrict, week }: {
    href: string; color: string; character: number; missions: WorldMissionLite[]; myDistrict: DistrictKey; week: number
})
{
    const progress = districtProgress(missions)
    const open = missions.filter((m) => m.status === 'available' || m.status === 'needs_revision').length

    return (
        <Link href={href} className="group hw-rise hw-lift block overflow-hidden rounded-3xl border border-border bg-card shadow-sm focus-visible:outline-none focus-visible:ring-2" style={{ animationDelay: '60ms', ['--tw-ring-color' as string]: color }}>
            {/* Scene */}
            <div className="relative h-52 overflow-hidden sm:h-60" style={{ background: `linear-gradient(180deg, #bfe6f7 0%, #dff3fb 55%, #9fd18a 56%, #86c46d 100%)` }}>
                <Skyline color={color} />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#102A43]/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    <Box className="h-3.5 w-3.5" /> 3D world · Week {week}
                </span>
                {/* Avatar at the Arrival Plaza */}
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                    <img src={characterPreviewUrl(character)} alt="" className="hw-float h-20 w-20 object-contain drop-shadow-lg sm:h-24 sm:w-24" />
                    <span className="-mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#102A43] shadow">You · Arrival Plaza</span>
                </div>
                {/* District pins (bigger screens) */}
                {DISTRICTS.map((d, i) =>
                {
                    const p = progress.get(d.key)!
                    const mine = d.key === myDistrict
                    return (
                        <span key={d.key} className="hw-pop absolute hidden -translate-x-1/2 flex-col items-center sm:flex" style={{ ...PIN[d.key], animationDelay: `${200 + i * 90}ms` }}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-base shadow-lg" style={{ backgroundColor: p.total && p.done === p.total ? '#16a34a' : mine ? color : '#102A43' }}>{d.emoji}</span>
                            <span className="mt-1 whitespace-nowrap rounded-full bg-[#102A43]/90 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                                {d.label}{p.total ? ` · ${p.done}/${p.total}` : ''}
                            </span>
                        </span>
                    )
                })}
            </div>

            {/* Copy + CTA */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-extrabold text-foreground sm:text-xl">Enter Hubnovo World</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Walk your avatar around the 3D Campus. Every district holds this week’s quests{open ? `: ${open} waiting for you` : ''}.
                    </p>
                    {/* District chips (phones) */}
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                        {DISTRICTS.map((d) => (
                            <span key={d.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                                {d.emoji} {d.label}
                            </span>
                        ))}
                    </div>
                </div>
                <span className="hw-press inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md transition-transform group-hover:translate-x-0.5" style={{ backgroundColor: color }}>
                    <MapPin className="h-4 w-4" /> Enter the 3D world <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
            </div>
        </Link>
    )
}

/** Flat, low-poly style skyline (decorative). */
function Skyline({ color }: { color: string })
{
    const win = (x: number, y: number, cols: number, rows: number, w = 5, h = 6, gx = 9, gy = 11) =>
        Array.from({ length: cols * rows }, (_, i) => <rect key={`${x}-${y}-${i}`} x={x + (i % cols) * gx} y={y + Math.floor(i / cols) * gy} width={w} height={h} rx={1} fill="#fef3c7" opacity={0.85} />)
    return (
        <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="520" cy="46" r="22" fill="#fde68a" opacity="0.9" />
            {/* far skyline */}
            <g fill="#9cc7dc">
                <rect x="20" y="90" width="40" height="45" /><rect x="70" y="70" width="30" height="65" /><rect x="430" y="80" width="36" height="55" /><rect x="545" y="95" width="40" height="40" />
                <rect x="250" y="60" width="26" height="75" /><rect x="320" y="76" width="34" height="59" />
            </g>
            {/* academy */}
            <g transform="translate(40,96)">
                <rect width="70" height="40" fill="#f1f5f9" /><polygon points="-6,0 35,-22 76,0" fill="#64748b" />
                {win(8, 8, 6, 2)}<rect x="30" y="22" width="10" height="18" fill="#475569" />
            </g>
            {/* career tower */}
            <g transform="translate(180,42)">
                <rect width="44" height="94" fill="#1e3a5f" /><rect x="44" y="20" width="22" height="74" fill="#274b73" />
                {win(6, 8, 4, 7)}
            </g>
            {/* rewards trophy island */}
            <g transform="translate(300,104)">
                <ellipse cx="14" cy="30" rx="34" ry="8" fill="#6b7280" opacity="0.35" />
                <rect x="4" y="22" width="20" height="8" rx="2" fill={color} />
                <path d="M4 2 h20 v6 a10 10 0 0 1 -20 0z" fill="#f6c445" /><rect x="12" y="14" width="4" height="8" fill="#f6c445" />
            </g>
            {/* arena with big screen */}
            <g transform="translate(400,72)">
                <rect width="60" height="64" fill="#334155" />{win(6, 10, 6, 4)}
                <rect x="66" y="10" width="40" height="26" rx="2" fill="#4b5563" /><rect x="69" y="13" width="34" height="20" fill={color} opacity="0.95" />
                <rect x="84" y="36" width="4" height="28" fill="#4b5563" />
            </g>
            {/* enterprise market */}
            <g transform="translate(500,104)">
                <rect width="80" height="32" fill="#fef3c7" /><rect y="-8" width="80" height="10" fill="#f97316" />
                <rect x="6" y="10" width="14" height="22" fill="#7c2d12" opacity="0.8" /><rect x="30" y="10" width="20" height="12" fill="#fde68a" /><rect x="56" y="10" width="18" height="12" fill="#fde68a" />
            </g>
            {/* palms */}
            {[[128, 136], [276, 138], [372, 136], [480, 138]].map(([x, y]) => (
                <g key={x} transform={`translate(${x},${y})`}>
                    <rect x="-1.5" y="-30" width="3" height="30" fill="#8b5a2b" />
                    <path d="M0 -30 q-14 -4 -20 6 M0 -30 q14 -4 20 6 M0 -30 q-6 -12 -16 -10 M0 -30 q6 -12 16 -10" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
                </g>
            ))}
            {/* road */}
            <rect x="0" y="150" width="600" height="18" fill="#4b5563" />
            {Array.from({ length: 15 }, (_, i) => <rect key={i} x={10 + i * 42} y="158" width="22" height="2.5" fill="#f8fafc" opacity="0.85" />)}
        </svg>
    )
}
