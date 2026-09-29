export interface RoadmapStage
{
    id: number
    title: string
    subtitle: string
}

export interface QuickActionCard
{
    id: string
    title: string
    subtitle: string
    icon: string
    color: string
    bgColor: string
    darkBgColor: string
    borderColor: string
    actionKey: string
}

export interface BusinessTemplate
{
    id: string
    title: string
    category: string
    icon: string
    color: string
    description: string
    pages: string
    fileFormat: string
}

export interface BusinessToolResource
{
    id: string
    title: string
    type: 'guide' | 'tool' | 'resource'
    icon: string
    description: string
    badge?: string
}

export interface BusinessSector
{
    id: string
    title: string
    image: string
    category: string
}

export interface JourneyChecklistItem
{
    id: string
    label: string
    completed: boolean
}

export interface FundingOpportunity
{
    id: string
    title: string
    highlight: string
    icon: string
    color: string
    badgeBg: string
    actionLabel: string
    type: 'microloan' | 'grants' | 'investor'
}

export interface SuccessStory
{
    id: string
    quote: string
    author: string
    role: string
    image: string
}

// ── 5 Roadmap Lifecycle Stages ──
export const ROADMAP_STAGES: RoadmapStage[] = [
    { id: 1, title: 'Ideate', subtitle: 'Validate your idea' },
    { id: 2, title: 'Plan', subtitle: 'Build your business plan' },
    { id: 3, title: 'Fund', subtitle: 'Access funding options' },
    { id: 4, title: 'Launch', subtitle: 'Register and set up' },
    { id: 5, title: 'Grow', subtitle: 'Scale and create impact' },
]

// ── 5 Core Quick Action Cards ──
export const QUICK_ACTIONS: QuickActionCard[] = [
    {
        id: 'validate',
        title: 'Validate My Idea',
        subtitle: 'Get feedback & insights',
        icon: 'lightbulb',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        darkBgColor: 'dark:bg-emerald-500/15',
        borderColor: 'border-emerald-500/20',
        actionKey: 'validate',
    },
    {
        id: 'plan',
        title: 'Business Plan',
        subtitle: 'Use our templates',
        icon: 'file-text',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10',
        darkBgColor: 'dark:bg-blue-500/15',
        borderColor: 'border-blue-500/20',
        actionKey: 'plan',
    },
    {
        id: 'funding',
        title: 'Access Funding',
        subtitle: 'Grants, loans & investors',
        icon: 'wallet',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-500/10',
        darkBgColor: 'dark:bg-purple-500/15',
        borderColor: 'border-purple-500/20',
        actionKey: 'funding',
    },
    {
        id: 'register',
        title: 'Register Business',
        subtitle: 'CAC, Tax & Compliance',
        icon: 'briefcase',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
        darkBgColor: 'dark:bg-amber-500/15',
        borderColor: 'border-amber-500/20',
        actionKey: 'register',
    },
    {
        id: 'grow',
        title: 'Grow & Scale',
        subtitle: 'Get mentorship & market access',
        icon: 'trending-up',
        color: 'text-teal-600 dark:text-teal-400',
        bgColor: 'bg-teal-500/10',
        darkBgColor: 'dark:bg-teal-500/15',
        borderColor: 'border-teal-500/20',
        actionKey: 'grow',
    },
]

// ── 5 Business Templates ──
export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
    {
        id: 'business-plan',
        title: 'Business Plan Template',
        category: 'Planning',
        icon: 'file-text',
        color: 'text-blue-500',
        description: 'Comprehensive 15-page business plan covering executive summary, market analysis, operations, and financial models tailored for Nigerian SMEs.',
        pages: '15 Pages',
        fileFormat: 'DOCX / PDF',
    },
    {
        id: 'financial-projection',
        title: 'Financial Projection Template',
        category: 'Finance',
        icon: 'bar-chart-3',
        color: 'text-emerald-500',
        description: 'Pre-formatted 3-year cash flow, P&L, balance sheet, and break-even projection spreadsheet with automated formulas.',
        pages: 'Spreadsheet',
        fileFormat: 'XLSX / Sheets',
    },
    {
        id: 'marketing-strategy',
        title: 'Marketing Strategy Template',
        category: 'Marketing',
        icon: 'megaphone',
        color: 'text-rose-500',
        description: 'Actionable customer acquisition blueprint, social media cadence, local distribution channels, and CAC:LTV measurement sheet.',
        pages: '10 Pages',
        fileFormat: 'PDF / Slides',
    },
    {
        id: 'operational-plan',
        title: 'Operational Plan Template',
        category: 'Operations',
        icon: 'settings',
        color: 'text-indigo-500',
        description: 'Standard operating procedures (SOP), inventory management protocols, vendor contracts, and staffing frameworks.',
        pages: '8 Pages',
        fileFormat: 'DOCX / PDF',
    },
    {
        id: 'pitch-deck',
        title: 'Pitch Deck Template',
        category: 'Fundraising',
        icon: 'presentation',
        color: 'text-sky-500',
        description: '12-slide investor-ready presentation deck structure proven to win angel checks and government enterprise grants.',
        pages: '12 Slides',
        fileFormat: 'PPTX / Keynote',
    },
]

// ── 6 Tools & Resources ──
export const TOOLS_AND_RESOURCES: BusinessToolResource[] = [
    {
        id: 'cac-guide',
        title: 'CAC Registration Guide',
        type: 'guide',
        icon: 'file-check-2',
        description: 'Step-by-step guide to registering your Business Name or Limited Company (LLC) directly on the CAC CRP portal.',
        badge: 'Popular',
    },
    {
        id: 'tax-guide',
        title: 'Tax Compliance Guide',
        type: 'guide',
        icon: 'shield-check',
        description: 'FIRS & State BIR tax breakdown, TIN registration, VAT thresholds, and Tax Clearance Certificate (TCC) walkthrough.',
    },
    {
        id: 'pricing-calc',
        title: 'Pricing Calculator',
        type: 'tool',
        icon: 'calculator',
        description: 'Calculate product cost, markup, profit margins, and distribution discounts in Naira with real-time margin analysis.',
        badge: 'Interactive',
    },
    {
        id: 'breakeven-calc',
        title: 'Break-even Calculator',
        type: 'tool',
        icon: 'pie-chart',
        description: 'Determine exactly how many units you must sell monthly to cover fixed overheads and start generating net profits.',
        badge: 'Interactive',
    },
    {
        id: 'market-research',
        title: 'Market Research Tools',
        type: 'resource',
        icon: 'search',
        description: 'Survey templates, demographic datasets for Nigerian states, and competitor benchmarking tools.',
    },
    {
        id: 'name-generator',
        title: 'Business Name Generator',
        type: 'tool',
        icon: 'sparkles',
        description: 'Generate catchy, memorable, and CAC-searchable Nigerian business names by industry and keyword.',
        badge: 'AI Powered',
    },
]

// ── 8 Featured Business Sectors ──
export const FEATURED_SECTORS: BusinessSector[] = [
    {
        id: 'agriculture',
        title: 'Agriculture',
        image: '/images/launchpad/sectors/agriculture.jpg',
        category: 'Agri-Tech & Farming',
    },
    {
        id: 'food',
        title: 'Food & Beverage',
        image: '/images/launchpad/sectors/food.jpg',
        category: 'Culinary & Packaged Goods',
    },
    {
        id: 'fashion',
        title: 'Fashion & Retail',
        image: '/images/launchpad/sectors/fashion.jpg',
        category: 'Apparel & Accessories',
    },
    {
        id: 'tech',
        title: 'Tech & Digital',
        image: '/images/launchpad/sectors/tech.jpg',
        category: 'Software & Online Services',
    },
    {
        id: 'health',
        title: 'Health & Wellness',
        image: '/images/launchpad/sectors/health.jpg',
        category: 'Clinics, Fitness & Care',
    },
    {
        id: 'solar',
        title: 'Renewable Energy',
        image: '/images/launchpad/sectors/solar.jpg',
        category: 'Solar & Clean Tech',
    },
    {
        id: 'creative',
        title: 'Creative Arts',
        image: '/images/launchpad/sectors/creative.jpg',
        category: 'Media, Film & Design',
    },
    {
        id: 'services',
        title: 'Services',
        image: '/images/launchpad/sectors/services.jpg',
        category: 'Professional & Trade Services',
    },
]

// ── 7-Step Business Launch Journey (Pillar 3 Specification) ──
export interface LaunchStepItem {
    id: number
    title: string
    subtitle: string
    actionKey: string
}

export const SEVEN_STEP_LAUNCH_JOURNEY: LaunchStepItem[] = [
    { id: 1, title: 'Business Profile', subtitle: 'Name, category, AI logo options, location, description', actionKey: 'profile' },
    { id: 2, title: 'CAC Registration', subtitle: 'Facilitated in-platform for ₦5,000 (subsidised)', actionKey: 'cac' },
    { id: 3, title: 'Digital Storefront', subtitle: 'Live product and service listings on NaijaMarket', actionKey: 'storefront' },
    { id: 4, title: 'Business Savings Goal', subtitle: 'Automated equipment/stock seed savings', actionKey: 'savings' },
    { id: 5, title: 'Launch Announcement', subtitle: 'Platform broadcast to community feed & local hub', actionKey: 'announcement' },
    { id: 6, title: 'CommunityFund Campaign', subtitle: 'Crowdfund startup capital from the community', actionKey: 'crowdfund' },
    { id: 7, title: 'TradeCred Score', subtitle: 'Build activity score unlocking formal credit', actionKey: 'tradecred' },
]

// ── Journey Setup Checklist ──
export const JOURNEY_CHECKLIST: JourneyChecklistItem[] = [
    { id: '1', label: '1. Business Profile setup', completed: true },
    { id: '2', label: '2. CAC Registration submitted', completed: false },
    { id: '3', label: '3. Digital Storefront created', completed: false },
    { id: '4', label: '4. Business Savings Goal active', completed: false },
    { id: '5', label: '5. Community Launch broadcast', completed: false },
    { id: '6', label: '6. CommunityFund Crowdfund', completed: false },
    { id: '7', label: '7. TradeCred Credit Score unlocked', completed: false },
]

// ── Funding Opportunities ──
export const FUNDING_OPPORTUNITIES: FundingOpportunity[] = [
    {
        id: 'microloan',
        title: 'Hubnovo Microloan',
        highlight: '₦50,000 - ₦5,000,000',
        icon: 'landmark',
        color: 'text-emerald-500',
        badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        actionLabel: 'Apply',
        type: 'microloan',
    },
    {
        id: 'grants',
        title: 'Grants & Competitions',
        highlight: 'Find grants for your industry',
        icon: 'trophy',
        color: 'text-purple-500',
        badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
        actionLabel: 'Explore',
        type: 'grants',
    },
    {
        id: 'investor',
        title: 'Investor Connections',
        highlight: 'Pitch to verified investors',
        icon: 'users-round',
        color: 'text-amber-500',
        badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        actionLabel: 'Get Started',
        type: 'investor',
    },
]

// ── Success Stories (Carousel) ──
export const SUCCESS_STORIES: SuccessStory[] = [
    {
        id: 'daniel-u',
        quote: 'Hubnovo helped me turn my idea into a profitable business with steady sales.',
        author: 'Daniel U.',
        role: 'Founder, DaniFoods',
        image: '/images/launchpad/testimonials/daniel-u.jpg',
    },
    {
        id: 'amaka-o',
        quote: 'Secured our first ₦2.5M seed grant within 6 weeks of refining our pitch deck here.',
        author: 'Amaka O.',
        role: 'CEO, Zuri Agro-Exports',
        image: '/images/launchpad/hero-entrepreneur.jpg',
    },
]
