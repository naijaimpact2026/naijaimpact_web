/** "Remote Job Opportunities" card art — briefcase + globe/network, replaces a stock photo. */
export default function JobsIllustration({ className = '' }: { className?: string })
{
    return (
        <svg viewBox="0 0 200 140" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="140" fill="#00A86B" />
            <circle cx="24" cy="24" r="28" fill="#102A43" opacity="0.3" />
            <circle cx="180" cy="110" r="24" fill="#8BD450" opacity="0.35" />
            <g transform="translate(70,38)" className="icon-float">
                <rect x="0" y="14" width="60" height="42" rx="7" fill="#F8FAFC" />
                <rect x="18" y="4" width="24" height="14" rx="4" fill="none" stroke="#102A43" strokeWidth="3" />
                <rect x="0" y="30" width="60" height="8" fill="#102A43" opacity="0.12" />
                <rect x="24" y="26" width="12" height="12" rx="2" fill="#00B8D9" />
            </g>
            <g transform="translate(30,92)" className="icon-float-delayed">
                <circle cx="0" cy="0" r="16" fill="none" stroke="#F8FAFC" strokeWidth="2.5" />
                <path d="M-16 0 H16 M0 -16 A16 8 0 0 1 0 16 A16 8 0 0 1 0 -16" fill="none" stroke="#F8FAFC" strokeWidth="2" opacity="0.8" />
            </g>
        </svg>
    )
}
