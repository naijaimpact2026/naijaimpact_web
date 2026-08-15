'use client'

import { Percent, Clock, DollarSign, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LoanProduct } from '@/lib/types'

function formatNGN(amount: number): string
{
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface LoanProductCardProps
{
    product: LoanProduct
    onSelect: (product: LoanProduct) => void
}

export default function LoanProductCard({ product, onSelect }: LoanProductCardProps)
{
    const tenureDisplay =
        product.tenure_options.length === 1
            ? `${product.tenure_options[0]} months`
            : `${product.tenure_options[0]}–${product.tenure_options[product.tenure_options.length - 1]} months`

    return (
        <div className="bento-card noise-bg p-5 space-y-4 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-base">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Min TradeCred score: {product.min_tradecred_score}
                    </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                    Active
                </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 rounded-lg p-2.5 text-center space-y-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-primary mx-auto" />
                    <p className="text-[10px] text-muted-foreground">Min Amount</p>
                    <p className="text-xs font-bold">{formatNGN(product.min_amount)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center space-y-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-secondary mx-auto" />
                    <p className="text-[10px] text-muted-foreground">Max Amount</p>
                    <p className="text-xs font-bold">{formatNGN(product.max_amount)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center space-y-0.5">
                    <Percent className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                    <p className="text-[10px] text-muted-foreground">Interest p.a.</p>
                    <p className="text-xs font-bold">{product.interest_rate_pa}%</p>
                </div>
            </div>

            {/* Tenure options */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">Tenure:</p>
                {product.tenure_options.map((t) => (
                    <span
                        key={t}
                        className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold"
                    >
                        {t}mo
                    </span>
                ))}
            </div>

            {/* Range label */}
            <p className="text-xs text-muted-foreground">
                Borrow {formatNGN(product.min_amount)} – {formatNGN(product.max_amount)} over {tenureDisplay}
            </p>

            {/* Apply button */}
            <Button
                className="mt-auto gap-2 gradient-primary text-white w-full"
                onClick={() => onSelect(product)}
            >
                Apply Now
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
