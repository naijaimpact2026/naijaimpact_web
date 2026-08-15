'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, FileText, ShoppingBag, Calendar } from 'lucide-react'
import InsureProductCard from './InsureProductCard'
import PolicyCard from './PolicyCard'
import ClaimsList from './ClaimsList'
import PurchasePolicyModal from './PurchasePolicyModal'
import type { InsureProduct, Policy, Claim } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string
{
    return new Date(dateStr).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsureDashboardClientProps
{
    products: InsureProduct[]
    policies: (Policy & { product: Pick<InsureProduct, 'name' | 'category'> | null })[]
    claims: (Claim & { policy: Pick<Policy, 'status'> | null })[]
    activePoliciesCount: number
    pendingClaimsCount: number
    nextPremiumDue: string | null
    userEmail: string
    userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InsureDashboardClient({
    products,
    policies,
    claims,
    activePoliciesCount,
    pendingClaimsCount,
    nextPremiumDue,
    userEmail,
    userId,
}: InsureDashboardClientProps)
{
    const [selectedProduct, setSelectedProduct] = useState<InsureProduct | null>(null)
    const [activeTab, setActiveTab] = useState('browse')

    // Build list of active policy summaries for claim filing
    const activePolicySummaries = policies
        .filter((p) => p.status === 'active')
        .map((p) => ({
            id: p.id,
            name: p.product?.name ?? 'Policy',
        }))

    return (
        <div className="space-y-8">
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-3xl font-bold text-gradient">NaijaInsure</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Micro-insurance — protect what matters, one month at a time
                </p>
            </div>

            {/* ── Summary stats ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mb-1">
                        <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Policies</p>
                    <p className="text-lg font-bold">{activePoliciesCount}</p>
                </div>

                <div className="bento-card noise-bg p-4 text-center space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-1">
                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending Claims</p>
                    <p className="text-lg font-bold">{pendingClaimsCount}</p>
                </div>

                <div className="bento-card noise-bg p-4 text-center space-y-1 col-span-2 sm:col-span-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 mb-1">
                        <Calendar className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Premium Due</p>
                    <p className="text-sm font-bold leading-tight">
                        {nextPremiumDue ? formatDate(nextPremiumDue) : '—'}
                    </p>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="browse" className="flex-1 sm:flex-none gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Browse
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="flex-1 sm:flex-none gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        My Policies
                        {activePoliciesCount > 0 && (
                            <span className="ml-1 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                                {activePoliciesCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1 sm:flex-none gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Claims
                        {pendingClaimsCount > 0 && (
                            <span className="ml-1 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full px-1.5 py-0.5 font-semibold">
                                {pendingClaimsCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ── Browse tab ─────────────────────────────────────────────────────── */}
                <TabsContent value="browse" className="mt-6">
                    {products.length === 0 ? (
                        <div className="bento-card noise-bg p-8 text-center space-y-3">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                                <Shield className="h-7 w-7 text-primary" />
                            </div>
                            <p className="font-medium">No insurance products available</p>
                            <p className="text-sm text-muted-foreground">
                                Check back later for available micro-insurance plans.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {products.map((product) => (
                                <InsureProductCard
                                    key={product.id}
                                    product={product}
                                    onPurchase={(p) => setSelectedProduct(p)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── My Policies tab ────────────────────────────────────────────────── */}
                <TabsContent value="policies" className="mt-6">
                    {policies.length === 0 ? (
                        <div className="bento-card noise-bg p-8 text-center space-y-3">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                                <Shield className="h-7 w-7 text-primary" />
                            </div>
                            <p className="font-medium">No policies yet</p>
                            <p className="text-sm text-muted-foreground">
                                Browse available plans and purchase your first policy.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {policies.map((policy) => (
                                <PolicyCard key={policy.id} policy={policy} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── Claims tab ─────────────────────────────────────────────────────── */}
                <TabsContent value="claims" className="mt-6">
                    <ClaimsList claims={claims} activePolicies={activePolicySummaries} />
                </TabsContent>
            </Tabs>

            {/* ── Purchase Policy Modal ─────────────────────────────────────────────── */}
            <PurchasePolicyModal
                open={!!selectedProduct}
                onOpenChange={(open) =>
                {
                    if (!open) setSelectedProduct(null)
                }}
                product={selectedProduct}
                userEmail={userEmail}
                userId={userId}
            />
        </div>
    )
}
