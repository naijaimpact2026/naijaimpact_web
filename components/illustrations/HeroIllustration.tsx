import { Users, Target, TrendingUp } from 'lucide-react'

const PATH = 'M40,185 Q140,185 140,110 Q140,35 245,35'

/**
 * "People → Opportunities → Prosperity" journey — the actual brand message,
 * not a decorative mockup. A real, native SVG animation (animateMotion) carries
 * particles up the path toward the Prosperity node. Blue/cyan/navy only.
 */
export default function HeroIllustration({ className = '' }: { className?: string })
{
    return (
        <div className={`relative rounded-3xl bg-white shadow-lg shadow-secondary/5 ring-1 ring-border overflow-hidden ${className}`}>
            <svg viewBox="0 0 280 220" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <defs>
                    <linearGradient id="heroPathGradient" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#102A43" />
                        <stop offset="55%" stopColor="#1569D6" />
                        <stop offset="100%" stopColor="#00B8D9" />
                    </linearGradient>
                </defs>

                <circle cx="245" cy="35" r="34" fill="#00B8D9" opacity="0.1" />

                <path d={PATH} stroke="#E2E8F0" strokeWidth="3" fill="none" />
                <path d={PATH} stroke="url(#heroPathGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" fill="none" />

                {/* animated particles traveling the journey, natively via SMIL */}
                <circle r="4" fill="#1569D6">
                    <animateMotion dur="3.2s" repeatCount="indefinite" path={PATH} />
                </circle>
                <circle r="3.5" fill="#00B8D9" opacity="0.8">
                    <animateMotion dur="3.2s" begin="1.07s" repeatCount="indefinite" path={PATH} />
                </circle>
                <circle r="3.5" fill="#102A43" opacity="0.7">
                    <animateMotion dur="3.2s" begin="2.13s" repeatCount="indefinite" path={PATH} />
                </circle>
            </svg>

            {/* People */}
            <div className="absolute flex flex-col items-center gap-1" style={{ left: '14%', top: '84%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-md">
                    <Users className="w-4 h-4" strokeWidth={2.25} />
                </div>
                <span className="text-[10px] font-bold text-secondary">People</span>
            </div>

            {/* Opportunities */}
            <div className="absolute flex flex-col items-center gap-1 icon-float" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                    <Target className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <span className="text-[10px] font-bold text-primary whitespace-nowrap">Opportunities</span>
            </div>

            {/* Prosperity */}
            <div className="absolute flex flex-col items-center gap-1" style={{ left: '87%', top: '16%', transform: 'translate(-50%, -50%)' }}>
                <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-cyan/40 animate-ping" />
                    <div className="relative w-12 h-12 rounded-full bg-cyan text-white flex items-center justify-center shadow-md">
                        <TrendingUp className="w-5 h-5" strokeWidth={2.25} />
                    </div>
                </div>
                <span className="text-[10px] font-bold text-cyan">Prosperity</span>
            </div>
        </div>
    )
}
