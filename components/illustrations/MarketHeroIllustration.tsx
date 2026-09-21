/** Marketplace hero art — a market stall with parcels and a shopping bag, replacing a stock photo. */
export default function MarketHeroIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 420 300" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Soft depth blobs */}
            <circle cx="352" cy="54" r="70" fill="#0E6EDC" opacity="0.18" />
            <circle cx="40" cy="250" r="90" fill="#8BD450" opacity="0.12" />
            <circle cx="60" cy="40" r="34" fill="#00B8D9" opacity="0.14" />

            {/* Ground shadow */}
            <ellipse cx="210" cy="270" rx="150" ry="14" fill="#102A43" opacity="0.08" />

            {/* Stall awning */}
            <g transform="translate(90,60)">
                <path d="M0 30 L20 0 H160 L180 30 Z" fill="#102A43" />
                <rect x="4" y="30" width="34.7" height="26" fill="#F8FAFC" />
                <rect x="38.7" y="30" width="34.7" height="26" fill="#0E6EDC" />
                <rect x="73.3" y="30" width="34.7" height="26" fill="#F8FAFC" />
                <rect x="108" y="30" width="34.7" height="26" fill="#00A86B" />
                <rect x="142.7" y="30" width="34.7" height="26" fill="#F8FAFC" />
                {/* Poles */}
                <rect x="8" y="56" width="6" height="70" fill="#102A43" />
                <rect x="166" y="56" width="6" height="70" fill="#102A43" />
                {/* Counter */}
                <rect x="0" y="126" width="180" height="14" rx="3" fill="#F8FAFC" stroke="#E5E9EF" strokeWidth="1.5" />
            </g>

            {/* Stacked parcels on the counter */}
            <g transform="translate(112,148)" className="icon-float">
                <rect x="0" y="10" width="46" height="36" rx="4" fill="#0E6EDC" />
                <rect x="0" y="10" width="46" height="10" rx="4" fill="#0A56AF" />
                <rect x="52" y="0" width="40" height="46" rx="4" fill="#00A86B" />
                <rect x="52" y="0" width="40" height="10" rx="4" fill="#04814F" />
                <rect x="98" y="16" width="38" height="30" rx="4" fill="#00B8D9" />
                <rect x="98" y="16" width="38" height="9" rx="4" fill="#0091AD" />
            </g>

            {/* Shopping bag, floating in front */}
            <g transform="translate(250,150)" className="icon-float-delayed">
                <path d="M6 22 H74 L68 90 H12 Z" fill="#F8FAFC" stroke="#E5E9EF" strokeWidth="1.5" />
                <path d="M6 22 H74 L70 40 H10 Z" fill="#8BD450" />
                <path d="M22 22 V10 a18 18 0 0 1 36 0 V22" fill="none" stroke="#102A43" strokeWidth="5" strokeLinecap="round" />
                <circle cx="40" cy="60" r="12" fill="#0E6EDC" />
                <path d="M34 60 l4 4 8-8" fill="none" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Floating price tag */}
            <g transform="translate(46,140)" className="icon-float">
                <path d="M0 10 L10 0 H40 a6 6 0 0 1 6 6 V36 a6 6 0 0 1 -6 6 H10 L0 32 Z" fill="#F8FAFC" stroke="#E5E9EF" strokeWidth="1.5" />
                <circle cx="14" cy="18" r="4" fill="#00B8D9" />
                <rect x="24" y="14" width="16" height="4" rx="2" fill="#102A43" opacity="0.5" />
                <rect x="24" y="22" width="20" height="4" rx="2" fill="#102A43" opacity="0.3" />
            </g>

            {/* Sparkle accents */}
            <g transform="translate(330,110)" className="icon-float">
                <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="#8BD450" />
            </g>
            <g transform="translate(70,90)" className="icon-float-delayed">
                <path d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" fill="#00B8D9" />
            </g>
        </svg>
    )
}
