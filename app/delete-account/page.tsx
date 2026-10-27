import Link from 'next/link'
import {
    ChevronRight, ArrowLeft, Trash2, AlertTriangle, Mail, FolderOpen, Heart, MessageCircle, FileText,
    Smartphone, User, Settings, CheckCircle2, ClipboardList, DollarSign, GraduationCap, BarChart3, Clock,
} from 'lucide-react'

export const metadata = {
    title: 'Delete Your Account — HubNovo',
    description: 'Learn how to delete your HubNovo account and request data removal.',
}

const steps = [
    {
        step: '01',
        icon: Smartphone,
        title: 'Open the HubNovo App',
        description: 'Launch the HubNovo mobile application or visit the website on your device. Ensure you are logged into the account you wish to delete.',
    },
    {
        step: '02',
        icon: User,
        title: 'Go to Your Profile',
        description: 'Tap your profile icon or avatar at the top of the screen. Select "My Profile" or "Account Settings" from the menu.',
    },
    {
        step: '03',
        icon: Settings,
        title: 'Open Account Settings',
        description: 'Scroll down within your profile or settings page to find the "Account" section. Look for "Privacy & Security" or "Account Management".',
    },
    {
        step: '04',
        icon: Trash2,
        title: 'Select "Delete Account"',
        description: 'Tap on "Delete Account" or "Close Account". Read the information provided about what will happen to your data and memberships.',
    },
    {
        step: '05',
        icon: CheckCircle2,
        title: 'Verify Your Identity',
        description: 'For your security, you may be asked to confirm your password, enter a verification code sent to your phone or email, or answer security questions.',
    },
    {
        step: '06',
        icon: ClipboardList,
        title: 'Confirm Deletion',
        description: 'Review the final confirmation screen. This is irreversible — once confirmed, your account and associated data will be scheduled for deletion. Tap "Confirm Delete" to proceed.',
    },
]

const warnings = [
    {
        icon: DollarSign,
        title: 'Cooperative Savings',
        desc: 'Outstanding cooperative savings or loans may need to be settled before account deletion is processed.',
    },
    {
        icon: GraduationCap,
        title: 'Scholarships & Grants',
        desc: 'Active scholarship or grant enrollments may be cancelled. Contact support to discuss alternatives.',
    },
    {
        icon: BarChart3,
        title: 'Transaction Records',
        desc: 'Financial records required for legal compliance may be retained even after account deletion.',
    },
    {
        icon: Clock,
        title: 'Processing Time',
        desc: 'Account deletion may take up to 30 days to fully process across all systems.',
    },
]

const retentionItems = [
    'Transaction and payment records — retained for up to 7 years',
    'Cooperative and loan records — retained as required by financial regulators',
    'Identity verification data — retained for anti-money laundering compliance',
    'Audit logs — retained for security and legal purposes',
]

const emailItems = [
    'Subject line: "Account Deletion Request"',
    'Your registered full name',
    'Your registered email address',
    'Your phone number',
    'Your membership ID (if applicable)',
    'Reason for deletion (optional)',
]

export default function DeleteAccountPage()
{
    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#3b0a0a 0%,#5c1010 45%,#7f1d1d 100%)' }}>
                {/* Glow blobs */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(248,113,113,.12),transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(248,113,113,.07),transparent 70%)' }} />
                {/* Grid overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 max-w-3xl mx-auto px-5 pt-10 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-300 border border-red-800/50 bg-red-900/30 mb-6">
                        HubNovo
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
                        <Trash2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">Delete Your Account</h1>
                    <p className="text-red-200/80 text-base max-w-xl mx-auto leading-relaxed">
                        We are sorry to see you go. Follow the steps below to permanently delete your HubNovo account and request data removal.
                    </p>
                    <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-red-200 border border-white/10">
                            Irreversible action
                        </span>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-800/40 text-red-200 border border-red-700/30">
                            Up to 30 days to process
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Sticky nav bar ── */}
            <div className="sticky top-0 z-20 border-b border-gray-200 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
                <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-3 h-3 text-red-700" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">Account Deletion</span>
                    </div>
                    <Link href="/privacy-policy"
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-full px-3 py-1.5 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Privacy Policy
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">

                {/* ── Warning banner ── */}
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-100"
                        style={{ background: 'linear-gradient(135deg,#fffbeb,#ffffff)' }}>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-black text-amber-800">Important Warning</span>
                    </div>
                    <div className="px-5 py-4">
                        <p className="text-sm text-amber-700 leading-relaxed">
                            Deleting your account will permanently remove your profile, membership data, activity history, and any associated benefits. <strong>This action is permanent and cannot be undone.</strong> Please read all information carefully before proceeding.
                        </p>
                    </div>
                </div>

                {/* ── Steps ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#fff1f2,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-4 h-4 text-red-600" /></div>
                        <h2 className="text-sm font-black text-gray-900">How to Delete Your Account</h2>
                    </div>
                    <div className="px-5 py-5 space-y-1">
                        {steps.map((s, i) => (
                            <div key={s.step} className="flex items-start gap-4">
                                {/* Timeline */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                                        <s.icon className="w-4 h-4 text-red-600" />
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="w-0.5 h-5 bg-gray-100 mt-1" />
                                    )}
                                </div>
                                {/* Content */}
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Step {s.step}</span>
                                        <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── What happens ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
                        <h2 className="text-sm font-black text-gray-900">What Happens When You Delete</h2>
                    </div>
                    <div className="p-5 grid sm:grid-cols-2 gap-3">
                        {warnings.map((w, i) => (
                            <div key={i} className="rounded-xl p-4 border border-gray-100 bg-gray-50">
                                <w.icon className="w-5 h-5 mb-2 text-gray-500" />
                                <h3 className="text-xs font-bold text-gray-800 mb-1">{w.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Email request ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-emerald-700" /></div>
                        <h2 className="text-sm font-black text-gray-900">Prefer to Request via Email?</h2>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            If you cannot access your account or prefer to submit a deletion request directly, send an email to our support team with the following information:
                        </p>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2.5 mb-5">
                            {emailItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                                        {i + 1}
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>
                        <a href="mailto:support@hubnovo.org?subject=Account%20Deletion%20Request"
                            className="inline-flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-red-700 transition-colors">
                            <Mail className="w-4 h-4" /> Send Deletion Request Email
                        </a>
                    </div>
                </div>

                {/* ── Data retention ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><FolderOpen className="w-4 h-4 text-blue-600" /></div>
                        <h2 className="text-sm font-black text-gray-900">Data Retention After Deletion</h2>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            In accordance with Nigerian data protection laws (NDPA/NDPR) and financial regulations, certain data may be retained for legal, regulatory, or fraud prevention purposes even after account deletion:
                        </p>
                        <ul className="space-y-2.5">
                            {retentionItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bottom CTA ── */}
                <div className="rounded-3xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                    <div className="px-6 py-8 text-center">
                        <Heart className="w-9 h-9 mb-3 mx-auto text-white/80" />
                        <h3 className="text-xl font-black text-white mb-2">Changed your mind?</h3>
                        <p className="text-green-300/70 text-sm mb-6 max-w-md mx-auto">
                            Our support team is happy to help you resolve any issues that led you here.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="mailto:support@hubnovo.org"
                                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors">
                                <MessageCircle className="w-4 h-4" /> Contact Support
                            </a>
                            <Link href="/privacy-policy"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                                <FileText className="w-4 h-4" /> Read Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2 pb-6">
                    <p className="text-xs text-gray-400">© 2025 HubNovo. All rights reserved.</p>
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
