/** "Support Small Businesses" card art — storefront + shopping bag, replaces a stock photo. */
export default function MarketIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 200 140" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="140" fill="#00B8D9" />
            <circle cx="176" cy="18" r="22" fill="#F8FAFC" opacity="0.2" />
            <circle cx="16" cy="118" r="26" fill="#102A43" opacity="0.2" />
            <g transform="translate(62,40)" className="icon-float">
                <path d="M0 10 L4 0 H72 L76 10 Z" fill="#102A43" />
                <rect x="4" y="10" width="68" height="40" fill="#F8FAFC" />
                <rect x="4" y="10" width="17" height="40" fill="#00A86B" />
                <rect x="21" y="10" width="17" height="40" fill="#F8FAFC" />
                <rect x="38" y="10" width="17" height="40" fill="#8BD450" />
                <rect x="55" y="10" width="17" height="40" fill="#F8FAFC" />
                <rect x="30" y="28" width="16" height="22" fill="#102A43" />
            </g>
            <g transform="translate(38,96)" className="icon-float-delayed">
                <path d="M0 8 H26 L23 26 H3 Z" fill="#F8FAFC" />
                <path d="M6 8 V3 a7 7 0 0 1 14 0 V8" fill="none" stroke="#102A43" strokeWidth="2.5" />
            </g>
        </svg>
    )
}
