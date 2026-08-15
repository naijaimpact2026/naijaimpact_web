import Link from 'next/link'
import { ChevronRight, Shield, AlertTriangle, Eye, Lock, Users, Flag, Phone, Heart } from 'lucide-react'

export const metadata = {
    title: 'Child Safety Standards — NaijaImpact',
    description: 'NaijaImpact is committed to creating a safe environment for all users with zero tolerance for child exploitation.',
}

const prohibitedItems = [
    'Child Sexual Abuse Material (CSAM)',
    'Grooming or attempting to exploit minors',
    'Sexualization of children in any form',
    'Human trafficking involving minors',
    'Child exploitation in any form',
    'Any content encouraging or facilitating abuse of minors',
    'Sharing links to CSAM or exploitative websites',
    'Soliciting explicit images from minors',
    'Any illegal activity involving children',
]

const reportableItems = [
    { icon: '📝', label: 'Inappropriate posts' },
    { icon: '💬', label: 'Messages' },
    { icon: '👤', label: 'Profiles' },
    { icon: '🛒', label: 'Marketplace listings' },
    { icon: '👥', label: 'Groups' },
    { icon: '💭', label: 'Comments' },
    { icon: '🖼️', label: 'Media' },
]

const enforcementActions = [
    { icon: '🚫', label: 'Content removal', color: '#ef4444', bg: '#fef2f2' },
    { icon: '⏸️', label: 'Temporary suspension', color: '#f97316', bg: '#fff7ed' },
    { icon: '🔒', label: 'Permanent account ban', color: '#7c3aed', bg: '#f5f3ff' },
    { icon: '📵', label: 'Device blocking', color: '#dc2626', bg: '#fef2f2' },
    { icon: '⚖️', label: 'Reporting to authorities', color: '#1d4ed8', bg: '#eff6ff' },
]

const minorProtections = [
    'Adults contacting minors for inappropriate purposes',
    'Sexual conversations involving minors',
    'Exploitative images of any kind',
    'Child grooming behaviour',
    'Requests for explicit content from minors',
]

const reportSteps = [
    { step: '01', icon: '🚨', title: 'Use the In-App Report Feature', desc: 'Tap the report button on any post, message, profile, or listing.' },
    { step: '02', icon: '📋', title: 'Select Report Reason', desc: 'Choose the most appropriate reason — select "Child Safety" or "Exploitation" where applicable.' },
    { step: '03', icon: '📝', title: 'Provide Details', desc: 'Include any relevant information that can help our moderation team act quickly.' },
    { step: '04', icon: '✅', title: 'Submit & We Review', desc: 'Urgent child safety reports are escalated immediately to our safety team.' },
]

const authorities = [
    { icon: '👮', label: 'National law enforcement agencies' },
    { icon: '🛡️', label: 'Child protection organizations' },
    { icon: '🏛️', label: 'Government authorities' },
]

export default function ChildSafetyPage()
{
    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a3a5c 0%,#0f2540 55%,#0a1a30 100%)' }}>
                {/* Glow blobs */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(59,130,246,.15),transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(59,130,246,.08),transparent 70%)' }} />
                {/* Grid overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 max-w-4xl mx-auto px-5 pt-10 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 border border-blue-700/50 bg-blue-900/30 mb-6">
                        🇳🇬 NaijaImpact
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl mx-auto mb-5">
                        🛡️
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">Child Safety Standards</h1>
                    <p className="text-blue-200/80 text-base max-w-xl mx-auto leading-relaxed">
                        At NaijaImpact, we are committed to creating a safe environment for all users.
                        We have <span className="text-white font-bold">zero tolerance</span> for any form of child sexual abuse, exploitation, or CSAM.
                    </p>
                    <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-blue-200 border border-white/10">
                            Effective Date: August 7, 2026
                        </span>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-800/40 text-blue-200 border border-blue-700/30">
                            Zero-Tolerance Policy
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Sticky nav ── */}
            <div className="sticky top-0 z-20 border-b border-gray-200 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
                <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-[11px]">🛡️</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">Child Safety</span>
                        <span className="text-gray-300 hidden sm:block">·</span>
                        <span className="text-[11px] text-gray-400 hidden sm:block">NaijaImpact</span>
                    </div>
                    <Link href="/privacy-policy"
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-full px-3 py-1.5 transition-colors">
                        Privacy Policy <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* ── Quick stat cards ── */}
            <div className="max-w-4xl mx-auto px-5 py-6">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: '🚫', label: 'Zero Tolerance', value: 'Policy' },
                        { icon: '⚡', label: 'Response Time', value: '24–48 hrs' },
                        { icon: '👮', label: 'Law Enforcement', value: 'Cooperation' },
                    ].map(({ icon, label, value }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <p className="text-sm font-black text-gray-900">{value}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-5 pb-10 space-y-4">

                {/* ── Our Commitment ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#eff6ff,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg shrink-0">💙</div>
                        <div>
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">01</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Our Commitment</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            NaijaImpact is dedicated to creating a safe, respectful platform for every user. We actively work to detect, remove, and report any content or behavior that endangers children. Any account found violating these standards will be <strong>permanently removed</strong> and may be reported to appropriate law enforcement authorities.
                        </p>
                        <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <p className="text-sm font-black text-red-800">Strictly Prohibited — Zero Tolerance</p>
                            </div>
                            <ul className="space-y-2">
                                {prohibitedItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-red-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── Safety Features ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">🔐</div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">02</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Safety Features</span>
                        </div>
                    </div>
                    <div className="px-5 py-5 space-y-5">
                        {/* User Reporting */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Flag className="w-4 h-4 text-blue-600" />
                                <p className="text-sm font-bold text-gray-800">User Reporting</p>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">Users can report any of the following directly from within the app:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {reportableItems.map((item) => (
                                    <div key={item.label}
                                        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                        <span className="text-lg shrink-0">{item.icon}</span>
                                        <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">All reports are reviewed promptly by our moderation team.</p>
                        </div>

                        {/* Content Moderation */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-purple-600" />
                                <p className="text-sm font-bold text-gray-800">Content Moderation</p>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">We use a multi-layered approach to identify and remove prohibited content:</p>
                            <div className="grid sm:grid-cols-3 gap-2">
                                {[
                                    { icon: '🤖', label: 'Automated detection systems', color: '#7c3aed', bg: '#f5f3ff' },
                                    { icon: '👥', label: 'Community reporting', color: '#2563eb', bg: '#eff6ff' },
                                    { icon: '👁️', label: 'Human moderators', color: '#059669', bg: '#f0fdf4' },
                                ].map((m) => (
                                    <div key={m.label} className="flex items-center gap-2.5 rounded-xl px-3 py-3 border border-gray-100 bg-white">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                            style={{ background: m.bg }}>
                                            {m.icon}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Account Enforcement ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#fff7ed,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg shrink-0">⚖️</div>
                        <div>
                            <span className="text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">03</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Account Enforcement</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4">Violations of our Child Safety Standards may result in:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {enforcementActions.map((action) => (
                                <div key={action.label}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3.5"
                                    style={{ background: action.bg }}>
                                    <span className="text-2xl shrink-0">{action.icon}</span>
                                    <span className="text-xs font-bold text-gray-800">{action.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Blocking & Privacy ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f5f3ff,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg shrink-0">🔒</div>
                        <div>
                            <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">04</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Blocking &amp; Privacy Tools</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4">Every NaijaImpact user has access to privacy tools to protect themselves:</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {[
                                { icon: '🚫', label: 'Block other users' },
                                { icon: '🚨', label: 'Report abusive behaviour' },
                                { icon: '👁️', label: 'Restrict profile visibility' },
                                { icon: '📩', label: 'Control who can contact you' },
                                { icon: '💬', label: 'Manage comment permissions' },
                            ].map((item) => (
                                <div key={item.label}
                                    className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <span className="text-lg shrink-0">{item.icon}</span>
                                    <span className="text-sm text-gray-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Protection of Minors ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#fef2f2,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-lg shrink-0">🧒</div>
                        <div>
                            <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full">05</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Protection of Minors</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4">NaijaImpact does not permit the following involving minors:</p>
                        <ul className="space-y-2">
                            {minorProtections.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                            Accounts suspected of violating these standards are <strong>immediately investigated</strong>.
                        </p>
                    </div>
                </div>

                {/* ── Law Enforcement Cooperation ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">👮</div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">06</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Cooperation with Law Enforcement</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4">
                            Where legally required, NaijaImpact cooperates fully with authorities regarding credible reports of child exploitation or abuse:
                        </p>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {authorities.map((a) => (
                                <div key={a.label}
                                    className="flex flex-col items-center text-center rounded-xl border border-gray-100 bg-gray-50 p-4 gap-2">
                                    <span className="text-3xl">{a.icon}</span>
                                    <span className="text-xs font-semibold text-gray-700">{a.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── How to Report ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#eff6ff,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg shrink-0">🚨</div>
                        <div>
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">07</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Reporting Child Safety Concerns</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-5">
                            If you encounter content or behaviour that may endanger a child, please act immediately:
                        </p>
                        <div className="space-y-1">
                            {reportSteps.map((s, i) => (
                                <div key={s.step} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-lg">
                                            {s.icon}
                                        </div>
                                        {i < reportSteps.length - 1 && <div className="w-0.5 h-5 bg-gray-100 mt-1" />}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Step {s.step}</span>
                                            <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Contact ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                        style={{ background: 'linear-gradient(135deg,#fdf4ff,#ffffff)' }}>
                        <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-lg shrink-0">📬</div>
                        <div>
                            <span className="text-[10px] font-black text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">08</span>
                            <span className="ml-2 text-sm font-black text-gray-900">Contact — Safety Team</span>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <p className="text-sm text-gray-500 mb-4">
                            For questions about our Child Safety Standards, or to report concerns outside the app:
                        </p>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { icon: '🏢', label: 'Team', value: 'Naija Impact Safety Team' },
                                { icon: '✉️', label: 'Email', value: 'naijaimpact2026@gmail.com' },
                                { icon: '⏱️', label: 'Response Time', value: 'Within 24–48 hours' },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                                    <div className="text-2xl mb-2">{icon}</div>
                                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                                    <p className="text-xs font-bold text-gray-800 mt-1">{value}</p>
                                </div>
                            ))}
                        </div>
                        <a href="mailto:naijaimpact2026@gmail.com?subject=Child%20Safety%20Concern%20-%20NaijaImpact"
                            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                            ✉️ Email Safety Team
                        </a>
                    </div>
                </div>

                {/* ── Zero Tolerance Banner ── */}
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl shrink-0">🚫</span>
                        <div>
                            <p className="text-sm font-black text-red-800 mb-1">Zero-Tolerance Policy</p>
                            <p className="text-sm text-red-700 leading-relaxed">
                                NaijaImpact maintains a strict zero-tolerance policy toward child sexual abuse and exploitation. We are committed to removing prohibited content, banning offending accounts, and cooperating with appropriate authorities to protect children.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer CTA ── */}
                <div className="rounded-3xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(150deg,#1a3a5c 0%,#0f2540 55%,#0a1a30 100%)' }}>
                    <div className="px-6 py-8 text-center">
                        <div className="text-4xl mb-3">💙</div>
                        <h3 className="text-xl font-black text-white mb-2">Every child deserves to be safe</h3>
                        <p className="text-blue-300/70 text-sm mb-6 max-w-md mx-auto">
                            Help us keep NaijaImpact a safe space. Report anything suspicious and we will act fast.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="mailto:naijaimpact2026@gmail.com?subject=Child%20Safety%20Concern%20-%20NaijaImpact"
                                className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                                🚨 Report a Concern
                            </a>
                            <Link href="/privacy-policy"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                                📄 Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2 pb-6">
                    <p className="text-xs text-gray-400">© 2026 NaijaImpact. All rights reserved.</p>
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
