/** Abstract skyline + network cover banner for profile pages — replaces a stock/AI photo. */
export default function ProfileCoverIllustration({ className = '' }: { className?: string })
{
    return (
        <svg
            viewBox="0 0 1200 260"
            preserveAspectRatio="xMidYMax slice"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="coverSky" x1="0" y1="0" x2="1" y2="0.6">
                    <stop offset="0%" stopColor="#0A1E33" />
                    <stop offset="55%" stopColor="#102A43" />
                    <stop offset="100%" stopColor="#16405F" />
                </linearGradient>
            </defs>
            <rect width="1200" height="260" fill="url(#coverSky)" />

            {/* dot-grid network */}
            <g opacity="0.3" stroke="#00B8D9" strokeWidth="1">
                <line x1="80" y1="60" x2="220" y2="30" />
                <line x1="220" y1="30" x2="360" y2="70" />
                <line x1="900" y1="40" x2="1040" y2="80" />
                <line x1="1040" y1="80" x2="1150" y2="35" />
            </g>
            <g fill="#00B8D9" opacity="0.8">
                <circle cx="80" cy="60" r="3" />
                <circle cx="220" cy="30" r="3" />
                <circle cx="360" cy="70" r="3" />
                <circle cx="900" cy="40" r="3" />
                <circle cx="1040" cy="80" r="3" />
                <circle cx="1150" cy="35" r="3" />
            </g>

            {/* skyline silhouette */}
            <g opacity="0.9">
                <rect x="0" y="190" width="70" height="70" fill="#0A1E33" />
                <rect x="60" y="150" width="90" height="110" fill="#0d2740" />
                <rect x="140" y="200" width="60" height="60" fill="#0A1E33" />
                <rect x="1000" y="170" width="80" height="90" fill="#0d2740" />
                <rect x="1080" y="210" width="60" height="50" fill="#0A1E33" />
                <rect x="1140" y="140" width="60" height="120" fill="#0d2740" />
            </g>

            {/* window lights */}
            <g fill="#00B8D9" opacity="0.8">
                <rect x="75" y="165" width="6" height="6" />
                <rect x="90" y="165" width="6" height="6" />
                <rect x="75" y="185" width="6" height="6" />
                <rect x="1015" y="190" width="6" height="6" />
                <rect x="1030" y="190" width="6" height="6" />
                <rect x="1155" y="160" width="6" height="6" />
                <rect x="1155" y="180" width="6" height="6" />
            </g>

            {/* soft glow blobs — emerald kept as a small accent only, cyan/navy dominate */}
            <circle cx="600" cy="30" r="90" fill="#00B8D9" opacity="0.14" />
            <circle cx="950" cy="120" r="60" fill="#00A86B" opacity="0.12" />
        </svg>
    )
}
