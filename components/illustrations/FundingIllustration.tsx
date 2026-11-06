/** "Fund a Community Project" card art — hands + water drop / growth, replaces a stock photo. */
export default function FundingIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 200 140" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="140" fill="#8BD450" />
            <circle cx="20" cy="22" r="20" fill="#102A43" opacity="0.15" />
            <circle cx="184" cy="112" r="26" fill="#00A86B" opacity="0.3" />
            <g transform="translate(76,30)" className="icon-float">
                <path d="M20 0 C30 16 34 24 34 32 A14 14 0 1 1 6 32 C6 24 10 16 20 0 Z" fill="#F8FAFC" />
                <path d="M20 8 C27 20 30 26 30 32 A10 10 0 1 1 10 32 C10 26 13 20 20 8 Z" fill="#00B8D9" />
            </g>
            <g transform="translate(56,88)" className="icon-float-delayed">
                <path d="M0 10 Q22 -8 44 10" stroke="#102A43" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="0" cy="10" r="7" fill="#102A43" />
                <circle cx="44" cy="10" r="7" fill="#102A43" />
                <circle cx="22" cy="2" r="6" fill="#F8FAFC" />
            </g>
        </svg>
    )
}
