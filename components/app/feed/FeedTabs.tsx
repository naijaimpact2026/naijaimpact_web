'use client'

import { LayoutGrid, List } from 'lucide-react'

export type FeedTab = 'for-you' | 'following' | 'groups' | 'opportunities' | 'events' | 'saved'
export type FeedLayout = 'list' | 'grid'

const TABS: { id: FeedTab; label: string }[] = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'groups', label: 'Groups' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'events', label: 'Events' },
    { id: 'saved', label: 'Saved' },
]

interface FeedTabsProps
{
    activeTab: FeedTab
    onTabChange: (tab: FeedTab) => void
    feedLayout?: FeedLayout
    onLayoutChange?: (layout: FeedLayout) => void
}

export default function FeedTabs({
    activeTab,
    onTabChange,
    feedLayout = 'list',
    onLayoutChange,
}: FeedTabsProps)
{
    return (
        <div className="flex items-center justify-between border-b border-border px-1">
            <div className="flex items-center overflow-x-auto scrollbar-none">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative shrink-0 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none cursor-pointer ${
                            activeTab === tab.id
                                ? 'text-primary font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Layout View Switcher (List vs Instagram Grid) - enabled for post tabs */}
            {onLayoutChange && (activeTab === 'for-you' || activeTab === 'following' || activeTab === 'saved') && (
                <div className="flex items-center gap-0.5 pr-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => onLayoutChange('list')}
                        aria-label="List feed layout"
                        title="List View"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            feedLayout === 'list'
                                ? 'bg-muted text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onLayoutChange('grid')}
                        aria-label="Instagram grid feed layout"
                        title="Instagram Grid View"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            feedLayout === 'grid'
                                ? 'bg-muted text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
