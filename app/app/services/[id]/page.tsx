import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchServiceById } from '@/lib/actions/services'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, CheckCircle2, BadgeCheck, Tag, Users, Star, MessageCircle } from 'lucide-react'
import ServiceDetailClient from '@/components/app/services/ServiceDetailClient'

export const dynamic = 'force-dynamic'

interface ServiceDetailPageProps
{
    params: Promise<{ id: string }>
}

function fmtNGN(n: number): string
{
    return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps)
{
    const { id } = await params
    const service = await fetchServiceById(id)
    if (!service) notFound()

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let currentUserId: string | null = null
    let currentUserName = ''

    if (authUser)
    {
        const { data: profile } = await supabase
            .from('users').select('id, display_name').eq('auth_id', authUser.id).single()
        currentUserId = profile?.id ?? null
        currentUserName = profile?.display_name ?? ''
    }

    const isOwner = currentUserId !== null && currentUserId === service.provider_id
    const sortedTiers = [...service.pricing_tiers].sort((a, b) => a.price - b.price)
    const minPrice = sortedTiers.length > 0 ? sortedTiers[0].price : 0

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* ── Dark green hero ── */}
            <div className="relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg,#1a5c38 0%,#0f3d25 55%,#0a2d1c 100%)' }}>
                <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle,rgba(74,222,128,.18),transparent 70%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative z-10 px-5 pt-5 pb-0 max-w-4xl mx-auto">
                    {/* Back link */}
                    <Link href="/app/services"
                        className="inline-flex items-center gap-1.5 text-green-400/70 hover:text-green-300 text-sm font-medium transition-colors mb-5">
                        <ArrowLeft className="w-4 h-4" /> Back to Services
                    </Link>

                    {/* Cover image — bleeds into content below */}
                    <div className="relative w-full rounded-t-2xl overflow-hidden bg-gray-900"
                        style={{ aspectRatio: '16/7' }}>
                        {service.cover_url ? (
                            <Image src={service.cover_url} alt={service.title} fill priority
                                className="object-cover opacity-90"
                                sizes="(max-width: 1024px) 100vw, 896px" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#1a5c38,#0f3d25)' }}>
                                <span className="text-7xl opacity-30">🛠️</span>
                            </div>
                        )}
                        {/* Category badge overlay */}
                        <div className="absolute top-4 left-4">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                                <Tag className="w-3 h-3" /> {service.category}
                            </span>
                        </div>
                        {/* Price overlay */}
                        {minPrice > 0 && (
                            <div className="absolute top-4 right-4">
                                <span className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-white shadow-lg">
                                    From {fmtNGN(minPrice)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-4xl mx-auto px-4 pb-8">
                {/* White card that sits over the hero bottom */}
                <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm px-5 pt-5 pb-4 mb-4">
                    <h1 className="text-2xl font-black text-gray-900 leading-tight">{service.title}</h1>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Link href={`/app/profile/${service.provider.username}`}
                            className="text-sm text-emerald-700 hover:underline font-semibold">
                            @{service.provider.username}
                        </Link>
                        {service.provider_verified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400 capitalize">{service.category}</span>
                    </div>
                    {/* Trust badges */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {[
                            { icon: CheckCircle2, text: 'Verified Listing', cls: 'text-emerald-600 bg-emerald-50' },
                            { icon: Star, text: 'Trusted Seller', cls: 'text-amber-600 bg-amber-50' },
                            { icon: Users, text: 'Community Member', cls: 'text-sky-600 bg-sky-50' },
                        ].map(({ icon: Icon, text, cls }) => (
                            <span key={text} className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cls}`}>
                                <Icon className="w-3 h-3" /> {text}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* ── Left column ── */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* About */}
                        {service.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
                                    About this Service
                                </h2>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {service.description}
                                </p>
                            </div>
                        )}

                        {/* Pricing tiers */}
                        {sortedTiers.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 pt-5 pb-3 border-b border-gray-50 flex items-center gap-2">
                                    <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
                                    <h2 className="font-bold text-gray-900">Pricing Plans</h2>
                                    <span className="ml-auto text-xs text-gray-400">{sortedTiers.length} plan{sortedTiers.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sortedTiers.map((tier, idx) => (
                                        <div key={idx}
                                            className={`rounded-2xl p-4 space-y-1.5 border-2 transition-all ${idx === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-gray-900 text-sm">{tier.label}</span>
                                                <span className={`text-lg font-black ${idx === 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                    {fmtNGN(tier.price)}
                                                </span>
                                            </div>
                                            {tier.description && (
                                                <p className="text-xs text-gray-500 leading-relaxed">{tier.description}</p>
                                            )}
                                            {idx === 0 && (
                                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                                                    Most Popular
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Provider card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
                                <h2 className="font-bold text-gray-900">About the Provider</h2>
                            </div>
                            <div className="flex items-start gap-4">
                                <Link href={`/app/profile/${service.provider.username}`}>
                                    <Avatar className="h-14 w-14 border-2 border-emerald-100">
                                        <AvatarImage src={service.provider.avatar_url ?? undefined} />
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-lg">
                                            {(service.provider.display_name || service.provider.username).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link href={`/app/profile/${service.provider.username}`}
                                            className="font-bold text-gray-900 hover:text-emerald-700 transition-colors">
                                            {service.provider.display_name}
                                        </Link>
                                        {service.provider_verified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
                                    </div>
                                    <p className="text-sm text-gray-400">@{service.provider.username}</p>
                                    {service.provider_profession && (
                                        <p className="text-sm text-gray-500 mt-0.5">{service.provider_profession}</p>
                                    )}
                                    {service.provider_bio && (
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-3">{service.provider_bio}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right column — action panel ── */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 sticky top-6">
                            {/* Price summary */}
                            {sortedTiers.length > 0 && (
                                <div>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Starting from</p>
                                    <p className="text-3xl font-black text-emerald-700 mt-0.5">{fmtNGN(sortedTiers[0].price)}</p>
                                    {sortedTiers.length > 1 && (
                                        <p className="text-xs text-gray-400 mt-0.5">{sortedTiers.length} pricing tiers available</p>
                                    )}
                                </div>
                            )}

                            {/* Tier checklist */}
                            {sortedTiers.length > 0 && (
                                <ul className="space-y-2">
                                    {sortedTiers.map((tier, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-gray-600">{tier.label}</span>
                                            <span className="ml-auto font-bold text-gray-900 text-xs">{fmtNGN(tier.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* CTA */}
                            <div className="pt-2 border-t border-gray-50">
                                <ServiceDetailClient
                                    serviceId={service.id}
                                    providerId={service.provider_id}
                                    providerName={service.provider.display_name}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    isOwner={isOwner}
                                />
                            </div>

                            {/* Trust note */}
                            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                🔒 Secure messaging · Verified listings · Community-backed
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
