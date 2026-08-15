import Link from 'next/link'
import { Shield, Lock, Eye, Database, Globe, Bell, Scale, AlertTriangle, ChevronRight } from 'lucide-react'

export const metadata = {
    title: 'Privacy Policy — NaijaImpact',
    description: 'Learn how NaijaImpact collects, uses, and protects your personal information.',
}

const sections = [
    {
        number: '01',
        icon: '🌍',
        title: 'Introduction',
        content: `Welcome to NaijaImpact — a humanitarian, empowerment, cooperative, education, financial inclusion, and digital community platform dedicated to empowering Nigerians and Africans through skills development, cooperative programs, grants, scholarships, financial support initiatives, entrepreneurship, digital services, and community development.

This Privacy Policy explains how NaijaImpact collects, uses, stores, protects, processes, and shares your personal information when you use our website, mobile applications, cooperative platforms, educational portals, community platforms, financial services, events, trainings, and any related products or services.

By accessing or using NaijaImpact services, you agree to the terms of this Privacy Policy.`,
    },
    {
        number: '02',
        icon: '🤝',
        title: 'Our Commitment to Privacy',
        bullets: [
            'Protecting the privacy and confidentiality of users',
            'Maintaining transparency in data collection and usage',
            'Implementing industry-standard security measures',
            'Preventing unauthorized access or misuse of personal information',
            'Respecting user rights regarding personal data',
            'Complying with applicable data protection and privacy laws',
        ],
    },
    {
        number: '03',
        icon: '📋',
        title: 'Information We Collect',
        subsections: [
            {
                title: 'Personal Identification',
                bullets: ['Full name', 'Date of birth', 'Gender', 'Nationality', 'Phone number', 'Email address', 'Residential address', 'Passport photograph', 'Government-issued ID', 'NIN', 'Bank account information', 'Employment or business information'],
            },
            {
                title: 'Technical Information',
                bullets: ['IP address', 'Browser type', 'Device information', 'Mobile device identifiers', 'Operating system', 'Network information', 'App usage data', 'Cookies and tracking technologies', 'Log files'],
            },
            {
                title: 'Financial & Transactions',
                bullets: ['Payment details', 'Transaction records', 'Cooperative savings data', 'Loan-related information', 'Grant disbursement records', 'Donation records', 'Financial verification information'],
            },
            {
                title: 'User Generated Content',
                bullets: ['Messages', 'Comments', 'Uploaded documents', 'Feedback', 'Testimonials', 'Audio, images, and videos submitted by users'],
            },
        ],
    },
    {
        number: '04',
        icon: '🔍',
        title: 'How We Collect Information',
        bullets: ['User registration forms', 'Mobile applications', 'Website forms', 'Cooperative enrollment', 'Surveys and questionnaires', 'Customer support interactions', 'Social media engagement', 'Events and physical outreach programs', 'Automated technologies such as cookies and analytics tools', 'Third-party integrations and verification partners'],
    },
    {
        number: '05',
        icon: '🎯',
        title: 'Purpose of Data Collection',
        bullets: ['Provide and improve services', 'Verify user identity', 'Manage cooperative operations', 'Facilitate grants, loans, scholarships, and empowerment programs', 'Process payments and transactions', 'Communicate with users', 'Deliver educational and training programs', 'Prevent fraud and abuse', 'Monitor compliance with policies', 'Improve user experience', 'Conduct research and analytics', 'Comply with legal and regulatory obligations'],
    },
    {
        number: '06',
        icon: '⚖️',
        title: 'Legal Basis for Processing',
        bullets: ['User consent', 'Contractual necessity', 'Compliance with legal obligations', 'Legitimate organizational interests', 'Public interest initiatives', 'Protection of vital interests'],
    },
    {
        number: '07',
        icon: '🍪',
        title: 'Cookies & Tracking Technologies',
        content: 'NaijaImpact may use cookies and related technologies to improve platform functionality, personalize user experience, analyze traffic and usage, enhance security, remember preferences, and measure performance. Users may disable cookies through browser settings; however, some features may not function properly.',
    },
    {
        number: '08',
        icon: '🤲',
        title: 'Data Sharing & Disclosure',
        content: 'NaijaImpact does not sell personal data. We may share information with authorized staff, financial institutions, government agencies where legally required, cooperative partners, service providers, legal authorities, and third-party organizations involved in empowerment programs. All third parties are expected to maintain appropriate confidentiality and security standards.',
    },
    {
        number: '09',
        icon: '🌐',
        title: 'International Data Transfers',
        content: 'Where data is transferred across borders, NaijaImpact shall implement appropriate safeguards to ensure adequate protection of personal information in accordance with applicable laws and international best practices.',
    },
    {
        number: '10',
        icon: '🗂️',
        title: 'Data Retention',
        bullets: ['Fulfill operational purposes', 'Meet legal and regulatory requirements', 'Resolve disputes', 'Maintain security records', 'Enforce agreements and policies'],
        content: 'Data that is no longer required may be securely deleted, anonymized, or archived.',
    },
    {
        number: '11',
        icon: '🔐',
        title: 'Data Security',
        bullets: ['Encryption technologies', 'Secure servers', 'Access controls', 'Password protection', 'Multi-factor authentication where applicable', 'Regular monitoring and audits', 'Staff confidentiality obligations', 'Cybersecurity measures'],
        content: 'Despite these safeguards, no system is completely secure, and users acknowledge the inherent risks of online communications and digital storage.',
    },
    {
        number: '12',
        icon: '✋',
        title: 'Your Rights',
        bullets: ['Access personal information', 'Correct inaccurate data', 'Request deletion of data', 'Withdraw consent', 'Restrict or object to processing', 'Request portability of data', 'Lodge complaints with regulatory authorities', 'Request clarification regarding data practices'],
        content: 'Requests may be submitted through the official NaijaImpact contact channels.',
    },
    {
        number: '13',
        icon: '👶',
        title: "Children's Privacy",
        content: "NaijaImpact does not knowingly collect personal information from children without appropriate parental or guardian consent where required by law. Where youth-focused programs exist, additional safeguards may be implemented.",
    },
    {
        number: '14',
        icon: '🔗',
        title: 'Third-Party Links & Services',
        content: 'NaijaImpact platforms may contain links to third-party websites, applications, or services. We are not responsible for the privacy practices or content of third-party platforms. Users are encouraged to review the privacy policies of external services before providing information.',
    },
    {
        number: '15',
        icon: '📣',
        title: 'Communications',
        bullets: ['SMS', 'Email', 'Phone calls', 'Push notifications', 'WhatsApp and messaging platforms', 'Social media channels'],
        content: 'Users may opt out of certain non-essential communications.',
    },
    {
        number: '16',
        icon: '📜',
        title: 'Compliance with Laws',
        bullets: ['Nigeria Data Protection Act (NDPA)', 'Nigeria Data Protection Regulation (NDPR)', 'Cybercrime laws', 'Consumer protection laws', 'Financial regulations', 'Anti-money laundering requirements', 'Other applicable international privacy standards'],
    },
    {
        number: '17',
        icon: '🚨',
        title: 'Reporting Security Incidents',
        bullets: ['Unauthorized account access', 'Fraudulent activities', 'Suspicious communications', 'Data breaches', 'Privacy concerns'],
        content: 'NaijaImpact may investigate and take appropriate action where necessary.',
    },
    {
        number: '18',
        icon: '🔄',
        title: 'Policy Updates',
        content: 'NaijaImpact reserves the right to modify or update this Privacy Policy at any time. Updated versions shall become effective upon publication on official platforms unless otherwise stated. Continued use of NaijaImpact services after updates constitutes acceptance of the revised Privacy Policy.',
    },
    {
        number: '19',
        icon: '📌',
        title: 'Disclaimer',
        content: 'This Privacy Policy is provided for informational and operational purposes and does not constitute legal advice. Users are encouraged to seek independent legal advice where necessary.',
    },
    {
        number: '20',
        icon: '✅',
        title: 'Acceptance of Policy',
        content: 'By accessing, registering for, or using NaijaImpact services, users acknowledge that they have read, understood, and agreed to this Privacy Policy.',
    },
]

export default function PrivacyPolicyPage()
{
    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.15),transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.08),transparent 70%)' }} />
                {/* Grid overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 max-w-4xl mx-auto px-5 pt-10 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-300 border border-green-700/50 bg-green-900/30 mb-6">
                        🇳🇬 NaijaImpact
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl mx-auto mb-5">
                        🔒
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">Privacy Policy</h1>
                    <p className="text-green-200/80 text-base max-w-xl mx-auto leading-relaxed">
                        Your privacy matters to us. This policy explains how we collect, use, and protect your personal information.
                    </p>
                    <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-green-200 border border-white/10">
                            Last updated: July 2025
                        </span>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600/40 text-green-200 border border-emerald-500/30">
                            Effective immediately
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Sticky nav bar ── */}
            <div className="sticky top-0 z-20 border-b border-gray-200 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
                <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-[11px]">🔒</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">Privacy Policy</span>
                        <span className="text-gray-300 hidden sm:block">·</span>
                        <span className="text-[11px] text-gray-400 hidden sm:block">20 sections</span>
                    </div>
                    <Link href="/delete-account"
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 rounded-full px-3 py-1.5 transition-colors">
                        🗑 Delete Account <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* ── Quick stats ── */}
            <div className="max-w-4xl mx-auto px-5 py-6">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: '🔐', label: 'Data Security', value: 'Bank-grade' },
                        { icon: '📜', label: 'Compliance', value: 'NDPA / NDPR' },
                        { icon: '✋', label: 'Your Rights', value: '8 Rights' },
                    ].map(({ icon, label, value }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <p className="text-sm font-black text-gray-900">{value}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Sections ── */}
            <div className="max-w-4xl mx-auto px-5 pb-10 space-y-4">
                {sections.map((section) => (
                    <div key={section.number} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                            style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                style={{ background: 'rgba(26,92,56,0.08)' }}>
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        {section.number}
                                    </span>
                                    <h2 className="text-sm font-black text-gray-900">{section.title}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Section body */}
                        <div className="px-5 py-4 space-y-3">
                            {section.content && (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                            )}

                            {section.bullets && (
                                <ul className="space-y-2">
                                    {section.bullets.map((b, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.subsections && (
                                <div className="grid sm:grid-cols-2 gap-3 mt-1">
                                    {section.subsections.map((sub, i) => (
                                        <div key={i} className="rounded-xl p-4 border border-gray-100 bg-gray-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
                                                <h3 className="text-xs font-bold text-gray-800">{sub.title}</h3>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {sub.bullets.map((b, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-xs text-gray-500">
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* ── Footer CTA ── */}
                <div className="rounded-3xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                    <div className="px-6 py-8 text-center">
                        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                        <div className="text-4xl mb-3">🤝</div>
                        <h3 className="text-xl font-black text-white mb-2">Questions about your data?</h3>
                        <p className="text-green-300/70 text-sm mb-6 max-w-md mx-auto">
                            Reach out to the NaijaImpact team for any privacy-related questions or data requests.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="mailto:privacy@naijaimpact.org"
                                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors">
                                ✉️ Email Us
                            </a>
                            <Link href="/delete-account"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                                🗑 Delete My Account
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2 pb-6">
                    <p className="text-xs text-gray-400">© 2025 NaijaImpact. All rights reserved.</p>
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
                        <Link href="/privacy-policy" className="hover:text-emerald-700 transition-colors font-medium">Privacy Policy</Link>
                        <span>·</span>
                        <Link href="/child-safety" className="hover:text-blue-600 transition-colors font-medium">Child Safety</Link>
                        <span>·</span>
                        <Link href="/delete-account" className="hover:text-red-600 transition-colors font-medium">Delete Account</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
