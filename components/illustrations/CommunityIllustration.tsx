/** Network of connected people — replaces a stock/AI photo on the Community hero. */
export default function CommunityIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 320 220" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="communityGlow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#102A43" />
                    <stop offset="100%" stopColor="#00688A" />
                </linearGradient>
            </defs>

            {/* connecting lines between people nodes */}
            <g stroke="#1569D6" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.5">
                <line x1="80" y1="150" x2="160" y2="90" />
                <line x1="160" y1="90" x2="240" y2="140" />
                <line x1="160" y1="90" x2="160" y2="30" />
                <line x1="240" y1="140" x2="290" y2="90" />
                <line x1="80" y1="150" x2="40" y2="90" />
            </g>

            {/* center hub person */}
            <g transform="translate(160,90)">
                <g className="icon-float">
                    <circle r="26" fill="url(#communityGlow)" />
                    <circle cy="-6" r="8" fill="#F8FAFC" />
                    <path d="M-12 16 Q0 -2 12 16 Z" fill="#F8FAFC" />
                </g>
            </g>

            {/* surrounding people nodes */}
            {[
                { x: 80, y: 150, fill: '#1569D6' },
                { x: 240, y: 140, fill: '#00B8D9' },
                { x: 160, y: 30, fill: '#00A86B' },
                { x: 290, y: 90, fill: '#8BD450' },
                { x: 40, y: 90, fill: '#00B8D9' },
            ].map((n, i) => (
                <g key={i} transform={`translate(${n.x},${n.y})`}>
                    <g className={i % 2 ? 'icon-float' : 'icon-float-delayed'}>
                        <circle r="16" fill={n.fill} opacity="0.9" />
                        <circle cy="-3.5" r="5" fill="#F8FAFC" />
                        <path d="M-7 9 Q0 -1 7 9 Z" fill="#F8FAFC" />
                    </g>
                </g>
            ))}
        </svg>
    )
}
