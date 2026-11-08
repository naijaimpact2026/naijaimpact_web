'use client'

import React, { useState } from 'react'
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    Coins,
    Download,
    Filter,
    Handshake,
    HelpCircle,
    Link2,
    Search,
    ShoppingBag,
} from 'lucide-react'
import type { CreatorTransaction, EarningRouteKey } from '@/lib/creator-earnings-data'

interface CreatorTransactionsLedgerProps {
    transactions: CreatorTransaction[]
}

const ROUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    tips: Coins,
    tickets: Calendar,
    marketplace: ShoppingBag,
    affiliates: Link2,
    sponsorships: Handshake,
    payout: ArrowUpRight,
}

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString('en-NG')}`
}

function formatDate(isoString: string) {
    try {
        const d = new Date(isoString)
        return d.toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return isoString
    }
}

export default function CreatorTransactionsLedger({ transactions }: CreatorTransactionsLedgerProps) {
    const [selectedTab, setSelectedTab] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

    // Filter logic
    const filteredTransactions = transactions.filter((tx) => {
        // Tab filter
        if (selectedTab !== 'all') {
            if (selectedTab === 'payout' && tx.route_key !== 'payout') return false
            if (selectedTab !== 'payout' && tx.route_key !== selectedTab) return false
        }

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            const matchesTitle = tx.title.toLowerCase().includes(query)
            const matchesPayer = tx.payer_name?.toLowerCase().includes(query) ?? false
            const matchesStream = tx.channel_or_stream?.toLowerCase().includes(query) ?? false
            const matchesNotes = tx.notes?.toLowerCase().includes(query) ?? false
            return matchesTitle || matchesPayer || matchesStream || matchesNotes
        }

        return true
    })

    const toggleRow = (id: string) => {
        setExpandedRowId((prev) => (prev === id ? null : id))
    }

    return (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                        Itemized Transaction Ledger
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Line-by-line transparency for every tip, ticket, product sale, and withdrawal.
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full rounded-full border border-border/80 bg-muted/40 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/50 text-xs">
                {[
                    { id: 'all', label: 'All Transactions' },
                    { id: 'tips', label: 'Viewer Tips' },
                    { id: 'tickets', label: 'Workshop Tickets' },
                    { id: 'marketplace', label: 'Storefront Sales' },
                    { id: 'affiliates', label: 'Affiliate Commissions' },
                    { id: 'payout', label: 'Withdrawals & Payouts' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTab(tab.id)}
                        className={`rounded-full px-3.5 py-1.5 font-semibold whitespace-nowrap transition-all ${
                            selectedTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Transactions Table */}
            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-border/70 bg-card/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                        <Coins className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                        {transactions.length === 0
                            ? 'No earnings transactions recorded yet'
                            : 'No transactions match your current filter'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-md">
                        {transactions.length === 0
                            ? 'Your live viewer tips, workshop ticket sales, storefront product purchases, and withdrawals will appear here with line-item transparency.'
                            : 'Try selecting a different filter tab or clearing your search term.'}
                    </p>
                    {transactions.length === 0 && (
                        <div className="mt-4 flex items-center gap-3">
                            <a
                                href="/app/modushive/studio"
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                            >
                                Start Live Broadcast
                            </a>
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                                <th className="pb-3 pl-2">Transaction</th>
                                <th className="pb-3 hidden md:table-cell">Source / Payer</th>
                                <th className="pb-3 text-right">Gross</th>
                                <th className="pb-3 text-right hidden sm:table-cell">Fees</th>
                                <th className="pb-3 text-right">Net Amount</th>
                                <th className="pb-3 text-center">Status</th>
                                <th className="pb-3 text-right pr-2">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                            {filteredTransactions.map((tx) => {
                                const Icon = ROUTE_ICONS[tx.route_key] || Coins
                                const isPayout = tx.route_key === 'payout'
                                const isExpanded = expandedRowId === tx.id

                                return (
                                    <React.Fragment key={tx.id}>
                                        <tr
                                            onClick={() => toggleRow(tx.id)}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3.5 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                                            isPayout
                                                                ? 'bg-blue-500/10 text-blue-500'
                                                                : 'bg-emerald-500/10 text-emerald-500'
                                                        }`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-foreground">
                                                            {tx.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {formatDate(tx.created_at)}
                                                            {tx.channel_or_stream && (
                                                                <span> • {tx.channel_or_stream}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 text-muted-foreground hidden md:table-cell">
                                                {tx.payer_name || 'Anonymous Viewer'}
                                            </td>

                                            <td className="py-3.5 text-right font-semibold text-foreground">
                                                {formatNaira(tx.gross_amount)}
                                            </td>

                                            <td className="py-3.5 text-right text-muted-foreground hidden sm:table-cell">
                                                {isPayout ? (
                                                    <span className="text-[10px]">₦0 fee</span>
                                                ) : (
                                                    <span>- {formatNaira(tx.payment_cost + tx.platform_fee)}</span>
                                                )}
                                            </td>

                                            <td
                                                className={`py-3.5 text-right font-extrabold ${
                                                    isPayout
                                                        ? 'text-blue-500'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {isPayout ? '-' : '+'}
                                                {formatNaira(tx.net_amount)}
                                            </td>

                                            <td className="py-3.5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                                        tx.status === 'settled' || tx.status === 'completed'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : tx.status === 'pending'
                                                            ? 'bg-amber-500/10 text-amber-500'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {tx.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 text-right pr-2">
                                                <button
                                                    type="button"
                                                    aria-label="Toggle details"
                                                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Itemized Fee Receipt */}
                                        {isExpanded && (
                                            <tr className="bg-muted/20">
                                                <td colSpan={7} className="p-4">
                                                    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-xs font-bold text-foreground">
                                                                Line-Item Transaction Breakdown
                                                            </h5>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ID: {tx.id}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                            <div className="rounded-xl bg-muted/40 p-2.5">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                                                    Gross Customer Value
                                                                </span>
                                                                <span className="font-extrabold text-foreground">
                                                                    {formatNaira(tx.gross_amount)}
                                                                </span>
                                                            </div>

                                                            <div className="rounded-xl bg-muted/40 p-2.5">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                                                    Payment Gateway (~1.5%)
                                                                </span>
                                                                <span className="font-semibold text-muted-foreground">
                                                                    {formatNaira(tx.payment_cost)}
                                                                </span>
                                                            </div>

                                                            <div className="rounded-xl bg-muted/40 p-2.5">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                                                    Platform Fee
                                                                </span>
                                                                <span className="font-semibold text-muted-foreground">
                                                                    {formatNaira(tx.platform_fee)}
                                                                </span>
                                                            </div>

                                                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                                                                    Net Creator Pass-Through
                                                                </span>
                                                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                    {formatNaira(tx.net_amount)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {tx.notes && (
                                                            <p className="text-[11px] text-muted-foreground pt-1">
                                                                <strong>Notes:</strong> {tx.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
