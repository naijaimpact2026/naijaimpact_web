'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import type { BusinessToolResource } from '@/lib/launchpad-data'
import {
    Calculator,
    PieChart,
    Sparkles,
    FileCheck2,
    ShieldCheck,
    Search,
    Copy,
    ArrowRight,
} from 'lucide-react'
import { toast } from '@/components/toast'

interface BusinessToolModalProps
{
    tool: BusinessToolResource | null
    onClose: () => void
}

export default function BusinessToolModal({ tool, onClose }: BusinessToolModalProps)
{
    // Calculator States
    const [cost, setCost] = useState('5000')
    const [margin, setMargin] = useState('35')

    // Break-even States
    const [fixedCost, setFixedCost] = useState('150000')
    const [unitPrice, setUnitPrice] = useState('10000')
    const [variableCost, setVariableCost] = useState('4000')

    // Name Generator State
    const [keyword, setKeyword] = useState('')
    const [generatedNames, setGeneratedNames] = useState<string[]>([])

    if (!tool) return null

    // Real-time Pricing Calculations
    const numCost = parseFloat(cost) || 0
    const numMargin = parseFloat(margin) || 0
    const calculatedPrice = numMargin < 100 ? numCost / (1 - numMargin / 100) : numCost * 2
    const profitPerUnit = calculatedPrice - numCost

    // Real-time Break-even Calculations
    const numFixed = parseFloat(fixedCost) || 0
    const numPrice = parseFloat(unitPrice) || 0
    const numVar = parseFloat(variableCost) || 0
    const contributionMargin = numPrice - numVar
    const breakevenUnits = contributionMargin > 0 ? Math.ceil(numFixed / contributionMargin) : 0
    const breakevenRevenue = breakevenUnits * numPrice

    const handleGenerateNames = () =>
    {
        const kw = keyword.trim() || 'Venture'
        const prefixes = ['Naija', 'Prime', 'Apex', 'Novo', 'Afritech', 'Crown', 'Lagos', 'Green']
        const suffixes = ['Hub', 'Ventures', 'Enterprises', 'Solutions', 'Logistics', 'Foods', 'Kraft', 'Dynamics']
        const results = [
            `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${kw}`,
            `${kw} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`,
            `${kw} Global Concepts`,
            `The ${kw} Studio`,
            `Novo${kw.charAt(0).toUpperCase() + kw.slice(1)} Africa`,
        ]
        setGeneratedNames(results)
    }

    return (
        <Dialog open={!!tool} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        {tool.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {tool.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    {/* 1. Pricing Calculator */}
                    {tool.id === 'pricing-calc' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Unit Cost (₦)</label>
                                    <input
                                        type="number"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Target Margin (%)</label>
                                    <input
                                        type="number"
                                        value={margin}
                                        onChange={(e) => setMargin(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                                        placeholder="35"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-muted-foreground">Recommended Selling Price:</span>
                                    <span className="text-lg font-black text-primary">
                                        ₦{Math.round(calculatedPrice).toLocaleString('en-NG')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Profit per Sale:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +₦{Math.round(profitPerUnit).toLocaleString('en-NG')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Break-even Calculator */}
                    {tool.id === 'breakeven-calc' && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Monthly Fixed Overheads (₦)</label>
                                    <input
                                        type="number"
                                        value={fixedCost}
                                        onChange={(e) => setFixedCost(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                                        placeholder="Rent, salaries, internet..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-foreground">Sale Price / Unit (₦)</label>
                                        <input
                                            type="number"
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-foreground">Variable Cost / Unit (₦)</label>
                                        <input
                                            type="number"
                                            value={variableCost}
                                            onChange={(e) => setVariableCost(e.target.value)}
                                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-muted-foreground">Break-Even Units Needed:</span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        {breakevenUnits.toLocaleString()} units / month
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Break-Even Monthly Revenue:</span>
                                    <span className="font-bold text-foreground">
                                        ₦{breakevenRevenue.toLocaleString('en-NG')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Business Name Generator */}
                    {tool.id === 'name-generator' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Enter keyword (e.g. fashion, solar, bakes)..."
                                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateNames()}
                                />
                                <button
                                    onClick={handleGenerateNames}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
                                >
                                    Generate
                                </button>
                            </div>

                            {generatedNames.length > 0 && (
                                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                                    <p className="text-xs font-bold text-foreground mb-1">Available Suggestions:</p>
                                    {generatedNames.map((name, i) => (
                                        <div
                                            key={i}
                                            onClick={() =>
                                            {
                                                navigator.clipboard.writeText(name)
                                                toast.success(`Copied "${name}" to clipboard!`)
                                            }}
                                            className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-primary/10 border border-border text-xs font-semibold text-foreground cursor-pointer transition-colors"
                                        >
                                            <span>{name}</span>
                                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Guides (CAC & Tax) */}
                    {(tool.id === 'cac-guide' || tool.id === 'tax-guide' || tool.id === 'market-research') && (
                        <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                                <p className="font-bold text-sm text-foreground">Step-by-Step Overview:</p>
                                <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                                    <li>Prepare 2 proposed business names and your National Identity Number (NIN).</li>
                                    <li>Visit the official portal or utilize Hubnovo&apos;s registered compliance partners.</li>
                                    <li>Submit objects of business, principal place of business, and partner details.</li>
                                    <li>Pay statutory filing fees and download your digital Status Report / Certificate.</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-muted text-xs font-bold text-foreground hover:bg-muted/80 cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
