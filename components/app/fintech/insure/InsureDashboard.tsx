'use client'

import { useState } from 'react'
import { Shield, FileText, LayoutGrid, Heart, Smartphone, Plane, CheckCircle2, Clock, AlertCircle, ChevronRight, CalendarDays, Star } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Script from 'next/script'
import InsureProductCard from './InsureProductCard'
import PolicyCard from './PolicyCard'
import ClaimsList from './ClaimsList'
import PurchasePolicyModal from './PurchasePolicyModal'
import type { InsureProduct } from '@/lib/types'
import type { PolicyWithProduct, ClaimWithPolicy } from '@/lib/actions/fintech/insure'

function fmtDate(d: string)
{
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface InsureDashboardProps
{
    products: InsureProduct[]
    policies: PolicyWithProduct[]
    claims: ClaimWithPolicy[]
    activePoliciesCount: number
    pendingClaimsCount: number
    nextPremiumDue: string | null
    userEmail: string
}

export default function InsureDashboard({ products, policies, claims, activePoliciesCount, pendingClaimsCount, nextPremiumDue, userEmail }: InsureDashboardProps)
{
    const [selectedProduct, setSelectedProduct] = useState<InsureProduct | null>(null)
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
    const [localActivePoliciesCount, setLocalActivePoliciesCount] = useState(activePoliciesCount)
    const [localPendingClaimsCount, setLocalPendingClaimsCount] = useState(pendingClaimsCount)

    function handlePurchaseClick(product: InsureProduct) { setSelectedProduct(product); setPurchaseModalOpen(true) }
    function handlePurchaseSuccess() { setLocalActivePoliciesCount(c => c + 1) }
    function handleClaimFiled() { setLocalPendingClaimsCount(c => c + 1) }

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
            <div className="space-y-5">
                {/* ── Stats cards ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: CheckCircle2, label: 'Active Policies', value: localActivePoliciesCount, cls: 'bg-teal-100 text-teal-700' },
                        { icon: Clock, label: 'Pending Claims', value: localPendingClaimsCount, cls: 'bg-amber-100 text-amber-700' },
                        { icon: CalendarDays, label: 'Next Premium', value: nextPremiumDue ? fmtDate(nextPremiumDue) : '—', cls: 'bg-violet-100 text-violet-700' },
                    ].map(({ icon: Icon, label, value, cls }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-gray-900">{value}</p>
                                <p className="text-[11px] text-gray-400">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Coverage types quick bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-gray-50">
                        {[
                            { icon: Heart, label: 'Health', cls: 'bg-red-50 text-red-600' },
                            { icon: Smartphone, label: 'Device', cls: 'bg-blue-50 text-blue-600' },
                            { icon: Plane, label: 'Travel', cls: 'bg-sky-50 text-sky-600' },
                            { icon: Shield, label: 'Life', cls: 'bg-teal-50 text-teal-600' },
                        ].map(({ icon: Icon, label, cls }) => (
                            <button key={label} className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls}`}><Icon className="w-4 h-4" /></div>
                                <span className="text-[11px] font-bold text-gray-600">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <Tabs defaultValue="browse">
                        <div className="px-5 pt-4 border-b border-gray-50">
                            <TabsList className="h-auto bg-transparent gap-1 p-0">
                                {[
                                    { value: 'browse', icon: LayoutGrid, label: 'Browse Plans', cls: 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700' },
                                    { value: 'my-policies', icon: Shield, label: 'My Policies', count: localActivePoliciesCount, cls: 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700' },
                                    { value: 'claims', icon: FileText, label: 'Claims', count: localPendingClaimsCount, cls: 'data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700' },
                                ].map(({ value, icon: Icon, label, count, cls }) => (
                                    <TabsTrigger key={value} value={value}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border border-transparent text-gray-500 hover:text-gray-700 transition-all ${cls}`}>
                                        <Icon className="w-3.5 h-3.5" /> {label}
                                        {count != null && count > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-0.5">{count}</span>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <div className="p-5">
                            <TabsContent value="browse" className="mt-0">
                                {products.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 flex flex-col items-center gap-3 text-center">
                                        <Shield className="w-10 h-10 text-gray-300" />
                                        <p className="font-bold text-gray-600">No products available</p>
                                        <p className="text-sm text-gray-400">Check back soon for insurance products.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {products.map(p => <InsureProductCard key={p.id} product={p} onPurchase={handlePurchaseClick} />)}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="my-policies" className="mt-0">
                                {policies.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50 p-10 flex flex-col items-center gap-3 text-center">
                                        <Shield className="w-10 h-10 text-teal-300" />
                                        <p className="font-bold text-gray-700">No policies yet</p>
                                        <p className="text-sm text-gray-400">Browse plans and purchase your first policy.</p>
                                        <button onClick={() => { }} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors">Browse Plans</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {policies.map(p => <PolicyCard key={p.id} policy={p} />)}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="claims" className="mt-0">
                                <ClaimsList claims={claims} activePolicies={policies.filter(p => p.status === 'active')} onClaimFiled={handleClaimFiled} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* ── Why NaijaInsure ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { icon: Star, title: 'Affordable', desc: 'Micro-insurance from as little as ₦500/month for real coverage.', cls: 'bg-amber-100 text-amber-700' },
                        { icon: CheckCircle2, title: 'Instant Coverage', desc: 'Policy activates immediately after payment — no waiting period.', cls: 'bg-emerald-100 text-emerald-700' },
                        { icon: Shield, title: 'Fast Claims', desc: 'File a claim in minutes, get reviewed and paid in days.', cls: 'bg-teal-100 text-teal-700' },
                    ].map(({ icon: Icon, title, desc, cls }) => (
                        <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}><Icon className="w-4 h-4" /></div>
                            <p className="font-bold text-gray-900 text-sm">{title}</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <PurchasePolicyModal open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen} product={selectedProduct} userEmail={userEmail} onSuccess={handlePurchaseSuccess} />
        </>
    )
}
