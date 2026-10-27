/** Small decorative graphic for the "Your Impact Matters" panel — a rising bar chart. */
export default function ImpactCtaIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 120 90" className={className} xmlns="http://www.w3.org/2000/svg">
            <circle cx="96" cy="18" r="20" fill="#8BD450" opacity="0.25" />
            <g className="icon-float">
                <rect x="10" y="50" width="14" height="30" rx="3" fill="#8BD450" />
                <rect x="32" y="34" width="14" height="46" rx="3" fill="#00B8D9" />
                <rect x="54" y="18" width="14" height="62" rx="3" fill="#F8FAFC" />
                <rect x="76" y="40" width="14" height="40" rx="3" fill="#8BD450" opacity="0.7" />
            </g>
            <path d="M10 46 L32 30 L54 14 L90 36" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 6" fill="none" opacity="0.8" />
        </svg>
    )
}
