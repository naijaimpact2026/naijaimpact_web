'use client'

import { useState } from 'react'
import { Loader2, RotateCcw, Send, X } from 'lucide-react'
import type { AttemptPayload, SortConfig } from '@/lib/world/types'

/** Tap an item, then tap the group it belongs to (works well on phones). */
export default function SortActivity({ config, color, submitting, onSubmit }: { config: SortConfig; color: string; submitting: boolean; onSubmit: (p: AttemptPayload) => void })
{
    const [placement, setPlacement] = useState<Record<string, string>>({})
    const [selected, setSelected] = useState<string | null>(null)
    const unplaced = config.items.filter((i) => !placement[i.id])
    const done = unplaced.length === 0

    function place(binId: string)
    {
        if (!selected) return
        setPlacement((p) => ({ ...p, [selected]: binId }))
        const nextUnplaced = config.items.find((i) => i.id !== selected && !placement[i.id])
        setSelected(nextUnplaced?.id ?? null)
    }

    function unplace(itemId: string)
    {
        setPlacement((p) => { const n = { ...p }; delete n[itemId]; return n })
        setSelected(itemId)
    }

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{config.prompt}</p>

            {unplaced.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{selected ? 'Now tap a group below' : 'Tap an item'} · {unplaced.length} left</p>
                    <div className="flex flex-wrap gap-2">
                        {unplaced.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelected(item.id)}
                                aria-pressed={selected === item.id}
                                className={`hw-press rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${selected === item.id ? 'hw-pop scale-[1.04] text-foreground shadow-md' : 'border-border text-foreground hover:-translate-y-0.5 hover:bg-muted/50'}`}
                                style={selected === item.id ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {config.bins.map((bin) =>
                {
                    const items = config.items.filter((i) => placement[i.id] === bin.id)
                    return (
                        <button
                            key={bin.id}
                            type="button"
                            onClick={() => place(bin.id)}
                            disabled={!selected}
                            className={`hw-press flex min-h-[140px] flex-col gap-2 rounded-2xl border-2 border-dashed p-3 text-left transition-colors ${selected ? 'hw-glow hover:bg-muted/40' : ''}`}
                            style={{ borderColor: selected ? color : undefined, ['--hw-glow' as string]: `${color}55` }}
                        >
                            <span className="text-sm font-bold text-foreground">{bin.label} <span className="font-semibold text-muted-foreground">({items.length})</span></span>
                            <span className="flex flex-wrap gap-1.5">
                                {items.map((i) => (
                                    <span
                                        key={i.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); unplace(i.id) }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); unplace(i.id) } }}
                                        className="hw-pop inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/70"
                                        title="Tap to move"
                                    >
                                        {i.label} <X className="h-3 w-3 opacity-60" />
                                    </span>
                                ))}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => { setPlacement({}); setSelected(null) }} className="hw-press inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button type="button" onClick={() => onSubmit({ kind: 'sort', placement })} disabled={!done || submitting} className="hw-press inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md hover:opacity-90 hover:shadow-lg disabled:opacity-40" style={{ backgroundColor: color }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </button>
            </div>
        </div>
    )
}
