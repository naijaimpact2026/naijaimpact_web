'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, ChevronDown, History } from 'lucide-react'
import type { TradeCredActivityLog } from '@/lib/types'

function fmtEventType(t: string) { return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
const PAGE_SIZE = 10

export default function ActivityLog({ logs }: { logs: TradeCredActivityLog[] })
{
    const [visible, setVisible] = useState(PAGE_SIZE)
    const visibleLogs = logs.slice(0, visible)

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <History className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">Activity Log</p>
                        <p className="text-[11px] text-gray-400">{logs.length} event{logs.length !== 1 ? 's' : ''} recorded</p>
                    </div>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-3 text-center">
                    <Minus className="w-10 h-10 text-gray-200" />
                    <p className="font-bold text-gray-500 text-sm">No activity yet</p>
                    <p className="text-xs text-gray-400">Start saving, transacting or completing courses to earn points.</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-50">
                        {visibleLogs.map(log =>
                        {
                            const pos = log.point_impact > 0
                            const zero = log.point_impact === 0
                            return (
                                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${zero ? 'bg-gray-100' : pos ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        {zero ? <Minus className="w-3.5 h-3.5 text-gray-400" /> : pos ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-gray-900 truncate">{fmtEventType(log.event_type)}</p>
                                            <span className={`shrink-0 text-sm font-black tabular-nums ${zero ? 'text-gray-400' : pos ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {pos ? '+' : ''}{log.point_impact} pts
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.description}</p>
                                        <p className="text-[10px] text-gray-300 mt-1">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {visible < logs.length && (
                        <div className="px-5 pb-5 pt-3">
                            <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                <ChevronDown className="w-4 h-4" /> Load more ({logs.length - visible} remaining)
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
