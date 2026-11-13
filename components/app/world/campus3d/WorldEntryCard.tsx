import Link from 'next/link'
import { ArrowRight, Box, MapPin } from 'lucide-react'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { DISTRICTS, districtProgress, type DistrictKey, type WorldMissionLite } from '@/lib/world/districts'

/*
 * The doorway to the 3D Campus, shown near the top of the Campus home: an
 * illustrated street with every district on it, its progress this week and
 * the player's avatar waiting at the Arrival Plaza. The whole card enters the
 * world; each district pin jumps straight into that district.
 */

// The scene is drawn in a 600 × 220 box. From md up the box keeps that ratio,
// so pins placed in the same units always sit on their building.
const W = 600, H = 220
const AT: Record<DistrictKey, { x: number; y: number }> = {
    learning_academy: { x: 75, y: 84 },
    career_district: { x: 192, y: 52 },
    competition_arena: { x: 305, y: 104 },
    enterprise_hub: { x: 420, y: 90 },
    rewards_exchange: { x: 530, y: 88 },
}
// Left-to-right order on the street.
const STREET: DistrictKey[] = ['learning_academy', 'career_district', 'competition_arena', 'enterprise_hub', 'rewards_exchange']

const withDistrict = (href: string, key: DistrictKey) => `${href}${href.includes('?') ? '&' : '?'}district=${key}`

export default function WorldEntryCard({ href, color, character, missions, myDistrict, week }: {
    href: string; color: string; character: number; missions: WorldMissionLite[]; myDistrict: DistrictKey; week: number
})
{
    const progress = districtProgress(missions)
    const open = missions.filter((m) => m.status === 'available' || m.status === 'needs_revision').length
    const byKey = new Map(DISTRICTS.map((d) => [d.key, d]))

    const status = (key: DistrictKey) =>
    {
        const p = progress.get(key)!
        if (key === 'rewards_exchange') return 'Spend HubTokens'
        if (!p.total) return (key === 'enterprise_hub' || key === 'career_district') && key !== myDistrict ? 'Other pathway' : 'Nothing this week'
        return p.done === p.total ? 'All done' : `${p.done}/${p.total} done`
    }
    const pinColor = (key: DistrictKey) =>
    {
        const p = progress.get(key)!
        return p.total && p.done === p.total ? '#16a34a' : key === myDistrict ? color : '#102A43'
    }

    return (
        <section className="group hw-rise hw-lift relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm" style={{ animationDelay: '60ms' }}>
            {/* The whole card is the way in; pins and chips sit above this link. */}
            <Link href={href} aria-label={`Enter the 3D Campus, week ${week}`} className="absolute inset-0 z-[1] rounded-3xl focus-visible:outline-none focus-visible:ring-2" style={{ ['--tw-ring-color' as string]: color }} />

            {/* Scene */}
            <div className="relative h-48 overflow-hidden bg-[#bfe6f7] md:h-auto md:aspect-[600/220]">
                <Street color={color} />
                <span className="pointer-events-none absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-[#102A43]/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    <Box className="h-3.5 w-3.5" /> 3D Campus · Week {week}
                </span>

                {/* Avatar on the Arrival Plaza */}
                <div className="pointer-events-none absolute bottom-[3%] left-1/2 z-[2] flex h-[46%] -translate-x-1/2 flex-col items-center">
                    <span className="absolute bottom-3 h-3 w-14 rounded-full bg-white/70 motion-safe:animate-ping" aria-hidden />
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
                    <img src={characterPreviewUrl(character)} alt="" className="hw-float relative min-h-0 flex-1 object-contain drop-shadow-lg" />
                    <span className="relative -mt-1 shrink-0 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#102A43] shadow">You · Arrival Plaza</span>
                </div>

                {/* District pins (md and up, where the scene keeps its shape) */}
                {STREET.map((key, i) =>
                {
                    const d = byKey.get(key)!
                    const mine = key === myDistrict
                    return (
                        <Link
                            key={key}
                            href={withDistrict(href, key)}
                            aria-label={`Open ${d.label}: ${status(key)}`}
                            className="hw-pop absolute z-[3] hidden -translate-x-1/2 flex-col items-center outline-none transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 md:flex"
                            style={{ left: `${(AT[key].x / W) * 100}%`, top: `${(AT[key].y / H) * 100}%`, animationDelay: `${200 + i * 90}ms` }}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-base shadow-lg ${mine ? 'ring-4 ring-white/40' : ''}`} style={{ backgroundColor: pinColor(key) }}>{d.emoji}</span>
                            <span className="mt-1 flex flex-col items-center rounded-xl bg-[#102A43]/90 px-2.5 py-1 leading-tight text-white shadow-md backdrop-blur-sm">
                                <span className="whitespace-nowrap text-[11px] font-bold">{d.label}</span>
                                <span className="whitespace-nowrap text-[10px] font-semibold text-white/75">{mine ? 'Your district · ' : ''}{status(key)}</span>
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* Copy + CTA */}
            <div className="pointer-events-none relative z-[2] flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-extrabold text-foreground sm:text-xl">Enter Hubnovo World</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Walk your avatar around the 3D Campus. Each district holds part of this week’s quests{open ? `, and ${open} ${open === 1 ? 'is' : 'are'} waiting for you` : ''}.
                        <span className="hidden md:inline"> Tap a district to jump straight in.</span>
                    </p>
                    {/* District chips (phones and tablets): each one opens its district */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 md:hidden">
                        {STREET.map((key) =>
                        {
                            const d = byKey.get(key)!
                            return (
                                <Link key={key} href={withDistrict(href, key)} className="pointer-events-auto relative z-[3] inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-background">
                                    <span aria-hidden>{d.emoji}</span> {d.label}
                                    {progress.get(key)!.total > 0 && <span className="text-muted-foreground">· {progress.get(key)!.done}/{progress.get(key)!.total}</span>}
                                </Link>
                            )
                        })}
                    </div>
                </div>
                <span className="hw-press inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md transition-transform group-hover:translate-x-0.5" style={{ backgroundColor: color }}>
                    <MapPin className="h-4 w-4" /> Enter the 3D world <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
            </div>
        </section>
    )
}

/** Flat, sunny street with every district on it (decorative; 600 × 220 units, ground line at y = 140). */
function Street({ color }: { color: string })
{
    const win = (x: number, y: number, cols: number, rows: number, w = 5, h = 6, gx = 9, gy = 11) =>
        Array.from({ length: cols * rows }, (_, i) => <rect key={`${x}-${y}-${i}`} x={x + (i % cols) * gx} y={y + Math.floor(i / cols) * gy} width={w} height={h} rx={1} fill="#fef3c7" opacity={0.9} />)
    const routes = STREET.filter((k) => k !== 'competition_arena').map((k) => AT[k].x)
    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
                <linearGradient id="hw-entry-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#9fd8f1" /><stop offset="1" stopColor="#e6f6fc" />
                </linearGradient>
            </defs>
            {/* sky, sun, clouds */}
            <rect x="-200" y="-200" width={W + 400} height="340" fill="url(#hw-entry-sky)" />
            <circle cx="566" cy="30" r="26" fill="#fde68a" opacity="0.35" /><circle cx="566" cy="30" r="16" fill="#fcd34d" />
            <g fill="#fff" opacity="0.85">
                <ellipse cx="96" cy="30" rx="22" ry="7" /><ellipse cx="110" cy="25" rx="14" ry="8" />
                <ellipse cx="262" cy="20" rx="20" ry="6" /><ellipse cx="274" cy="16" rx="11" ry="6" />
                <ellipse cx="438" cy="34" rx="24" ry="7" /><ellipse cx="452" cy="29" rx="13" ry="7" />
            </g>
            {/* far skyline */}
            <g fill="#a7cfe2">
                <rect x="4" y="92" width="28" height="48" /><rect x="122" y="72" width="26" height="68" /><rect x="236" y="80" width="26" height="60" />
                <rect x="350" y="70" width="26" height="70" /><rect x="466" y="88" width="30" height="52" /><rect x="572" y="84" width="30" height="56" />
            </g>

            {/* ground, road, pavement */}
            <rect x="-200" y="140" width={W + 400} height="200" fill="#8fcb76" />
            <rect x="-200" y="178" width={W + 400} height="160" fill="#84c26b" />
            <rect x="-200" y="140" width={W + 400} height="16" fill="#4b5563" />
            {Array.from({ length: 16 }, (_, i) => <rect key={i} x={4 + i * 38} y="147" width="20" height="2.2" fill="#f8fafc" opacity="0.85" />)}
            <rect x="-200" y="156" width={W + 400} height="3" fill="#d6d3d1" />

            {/* Arrival Plaza and the walking routes out of it */}
            <rect x="290" y="159" width="20" height="24" fill="#e7e5e4" />
            {routes.map((x) => (
                <path key={x} d={`M300 186 Q ${(300 + x) / 2} ${172} ${x} 160`} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" opacity="0.8" />
            ))}
            <ellipse cx="300" cy="200" rx="96" ry="20" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="2" />
            <ellipse cx="300" cy="200" rx="60" ry="12" fill="#f5f5f4" />
            {[[205, 194], [395, 194], [178, 206], [422, 206]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" fill="#4d9b3f" />)}

            {/* Learning Academy */}
            <g>
                <rect x="35" y="100" width="80" height="40" fill="#f8fafc" />
                <polygon points="29,100 75,78 121,100" fill="#475569" />
                {[42, 56, 88, 102].map((x) => <rect key={x} x={x} y="104" width="5" height="36" fill="#e2e8f0" />)}
                <rect x="68" y="118" width="14" height="22" fill="#334155" />
                <rect x="74.5" y="56" width="1.6" height="24" fill="#64748b" />
                <polygon points="76,56 92,61 76,66" fill={color} />
            </g>
            {/* Career District tower */}
            <g>
                <rect x="170" y="38" width="44" height="102" fill="#1e3a5f" />
                <rect x="214" y="64" width="24" height="76" fill="#274b73" />
                <rect x="191" y="26" width="2" height="12" fill="#1e3a5f" />
                {win(176, 46, 4, 8)}
                {win(219, 72, 2, 6)}
            </g>
            {/* Competition Arena with its big screen */}
            <g>
                <rect x="276" y="58" width="3" height="36" fill="#4b5563" /><rect x="331" y="58" width="3" height="36" fill="#4b5563" />
                <rect x="266" y="38" width="78" height="34" rx="3" fill="#374151" />
                <rect x="270" y="42" width="70" height="26" rx="1.5" fill={color} />
                <rect x="278" y="49" width="30" height="3" rx="1.5" fill="#fff" opacity="0.9" /><rect x="278" y="56" width="44" height="3" rx="1.5" fill="#fff" opacity="0.6" />
                <rect x="248" y="92" width="114" height="8" rx="4" fill="#475569" />
                <rect x="252" y="96" width="106" height="44" rx="6" fill="#334155" />
                {[258, 276, 294, 312, 330, 348].map((x) => <rect key={x} x={x} y="112" width="10" height="28" rx="5" fill="#1f2937" />)}
            </g>
            {/* Enterprise Hub market */}
            <g>
                <rect x="380" y="108" width="80" height="32" fill="#fef3c7" />
                {Array.from({ length: 8 }, (_, i) => <rect key={i} x={380 + i * 10} y="98" width="10" height="12" fill={i % 2 ? '#fff7ed' : '#f97316'} />)}
                <rect x="398" y="84" width="44" height="11" rx="2" fill="#7c2d12" />
                <rect x="386" y="116" width="16" height="24" fill="#7c2d12" opacity="0.85" />
                <rect x="408" y="116" width="20" height="12" fill="#fde68a" /><rect x="434" y="116" width="20" height="12" fill="#fde68a" />
            </g>
            {/* Rewards Exchange trophy */}
            <g>
                <rect x="504" y="136" width="52" height="4" fill="#475569" />
                <rect x="510" y="122" width="40" height="15" rx="2" fill={color} />
                <rect x="520" y="114" width="20" height="8" rx="1" fill="#d4a017" />
                <rect x="527" y="104" width="6" height="11" fill="#f6c445" />
                <path d="M512 74 h36 v10 a18 18 0 0 1 -36 0z" fill="#f6c445" />
                <path d="M512 78 q-10 0 -8 9 q2 6 10 6 M548 78 q10 0 8 9 q-2 6 -10 6" fill="none" stroke="#f6c445" strokeWidth="3" />
                <path d="M565 66 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#fff" opacity="0.9" />
            </g>

            {/* palms between districts */}
            {[[136, 140], [482, 140], [12, 140]].map(([x, y]) => (
                <g key={x} transform={`translate(${x},${y})`}>
                    <rect x="-1.5" y="-30" width="3" height="30" fill="#8b5a2b" />
                    <path d="M0 -30 q-14 -4 -20 6 M0 -30 q14 -4 20 6 M0 -30 q-6 -12 -16 -10 M0 -30 q6 -12 16 -10" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
                </g>
            ))}
        </svg>
    )
}
