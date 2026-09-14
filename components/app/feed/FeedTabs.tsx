'use client'

export type FeedTab = 'for-you' | 'following' | 'groups' | 'opportunities' | 'events' | 'saved'

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
}

export default function FeedTabs({ activeTab, onTabChange }: FeedTabsProps)
{
    return (
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-border">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none ${activeTab === tab.id
                            ? 'text-primary'
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
    )
}
