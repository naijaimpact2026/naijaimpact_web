/** "Free Digital Skills Training" card art — open book / screen + progress, replaces a stock photo. */
export default function CourseIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 200 140" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="140" fill="#102A43" />
            <circle cx="170" cy="20" r="26" fill="#00A86B" opacity="0.35" />
            <circle cx="20" cy="120" r="30" fill="#00B8D9" opacity="0.25" />
            <g transform="translate(58,34)" className="icon-float">
                <rect x="0" y="0" width="84" height="60" rx="8" fill="#F8FAFC" />
                <rect x="0" y="0" width="84" height="14" rx="8" fill="#00A86B" />
                <rect x="10" y="24" width="64" height="5" rx="2.5" fill="#102A43" opacity="0.7" />
                <rect x="10" y="34" width="46" height="5" rx="2.5" fill="#00B8D9" />
                <rect x="10" y="44" width="54" height="5" rx="2.5" fill="#8BD450" />
            </g>
            <g transform="translate(40,96)">
                <circle cx="0" cy="0" r="6" fill="#8BD450" />
                <circle cx="16" cy="0" r="6" fill="#00B8D9" />
                <circle cx="32" cy="0" r="6" fill="#F8FAFC" />
            </g>
        </svg>
    )
}
