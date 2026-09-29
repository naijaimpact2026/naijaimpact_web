'use client'

import React, { useState } from 'react'
import LaunchpadHero from './launchpad/LaunchpadHero'
import LaunchpadRoadmapStepper from './launchpad/LaunchpadRoadmapStepper'
import LaunchpadActionCards from './launchpad/LaunchpadActionCards'
import LaunchpadTemplates from './launchpad/LaunchpadTemplates'
import LaunchpadToolsResources from './launchpad/LaunchpadToolsResources'
import LaunchpadSectors from './launchpad/LaunchpadSectors'
import LaunchpadJourneyTracker from './launchpad/LaunchpadJourneyTracker'
import LaunchpadFundingOpportunities from './launchpad/LaunchpadFundingOpportunities'
import LaunchpadSuccessStories from './launchpad/LaunchpadSuccessStories'
import LaunchpadAdvisoryCard from './launchpad/LaunchpadAdvisoryCard'
import BusinessTemplateModal from './launchpad/BusinessTemplateModal'
import BusinessToolModal from './launchpad/BusinessToolModal'
import FundingApplicationModal from './launchpad/FundingApplicationModal'
import AdvisoryBookingModal from './launchpad/AdvisoryBookingModal'
import BusinessProfileModal from './launchpad/BusinessProfileModal'
import CacRegistrationModal from './launchpad/CacRegistrationModal'
import CacCertificateModal from './launchpad/CacCertificateModal'
import CacStatusTrackerCard from './launchpad/CacStatusTrackerCard'
import DigitalStorefrontModal from './launchpad/DigitalStorefrontModal'
import BusinessSavingsGoalModal from './launchpad/BusinessSavingsGoalModal'
import LaunchAnnouncementModal from './launchpad/LaunchAnnouncementModal'
import CommunityFundModal from './launchpad/CommunityFundModal'
import TradeCredScoreModal from './launchpad/TradeCredScoreModal'
import {
    type BusinessTemplate,
    type BusinessToolResource,
    type BusinessSector,
    type FundingOpportunity,
    type RoadmapStage,
    BUSINESS_TEMPLATES,
    TOOLS_AND_RESOURCES,
    FUNDING_OPPORTUNITIES,
} from '@/lib/launchpad-data'
import type { BusinessProfile, CacApplication } from '@/lib/types'
import { toast } from '@/components/toast'
import { ArrowRight, Sparkles } from 'lucide-react'

interface BusinessLaunchHomeProps {
    displayName?: string
    initialBusiness?: BusinessProfile | null
    initialCacApplication?: CacApplication | null
    initialWalletBalance?: number
    initialStepProgress?: number
    services?: any[]
    myServices?: any[]
    savedAmount?: number
    savingsGoal?: number
    daysSaved?: number
    totalDays?: number
    applicationsCount?: number
    formalizedCount?: number
}

export default function BusinessLaunchHome({
    displayName = 'Entrepreneur',
    initialBusiness = null,
    initialCacApplication = null,
    initialWalletBalance = 0,
    initialStepProgress = 1,
}: BusinessLaunchHomeProps) {
    // Business & CAC data state
    const [business, setBusiness] = useState<BusinessProfile | null>(initialBusiness)
    const [cacApplication, setCacApplication] = useState<CacApplication | null>(initialCacApplication)
    const [walletBalance, setWalletBalance] = useState<number>(initialWalletBalance)
    const [stepProgress, setStepProgress] = useState<number>(() => {
        if (initialStepProgress && initialStepProgress > 1) return initialStepProgress
        if (initialCacApplication?.status === 'approved') return 3
        if (initialBusiness) return 2
        return 1
    })

    // Active Roadmap stage (1: Ideate, 2: Plan, 3: Fund, 4: Launch, 5: Grow)
    const defaultStage = cacApplication?.status === 'approved' ? 4 : business ? 2 : 1
    const [activeStageId, setActiveStageId] = useState(defaultStage)

    // Modals state
    const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplate | null>(null)
    const [selectedTool, setSelectedTool] = useState<BusinessToolResource | null>(null)
    const [selectedFunding, setSelectedFunding] = useState<FundingOpportunity | null>(null)
    const [advisoryOpen, setAdvisoryOpen] = useState(false)
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [cacModalOpen, setCacModalOpen] = useState(false)
    const [certModalOpen, setCertModalOpen] = useState(false)
    const [storefrontModalOpen, setStorefrontModalOpen] = useState(false)
    const [savingsModalOpen, setSavingsModalOpen] = useState(false)
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false)
    const [crowdfundModalOpen, setCrowdfundModalOpen] = useState(false)
    const [tradecredModalOpen, setTradecredModalOpen] = useState(false)

    // Handlers
    const handleSelectStage = (stage: RoadmapStage) => {
        setActiveStageId(stage.id)
        toast.success(`Navigated to stage ${stage.id}: ${stage.title} (${stage.subtitle})`)
    }

    const handleSelectAction = (actionKey: string) => {
        switch (actionKey) {
            case 'validate':
                setSelectedTool(TOOLS_AND_RESOURCES.find((t) => t.id === 'market-research') || TOOLS_AND_RESOURCES[0])
                break
            case 'plan':
                setSelectedTemplate(BUSINESS_TEMPLATES[0])
                break
            case 'funding':
                setSelectedFunding(FUNDING_OPPORTUNITIES[0])
                break
            case 'register':
                if (!business) {
                    toast.info('Please set up your business profile first before registering with Hubnovo.')
                    setProfileModalOpen(true)
                } else {
                    setCacModalOpen(true)
                }
                break
            case 'grow':
                setAdvisoryOpen(true)
                break
            default:
                break
        }
    }

    const handleSelectSector = (sector: BusinessSector) => {
        toast.success(`Exploring templates & funding opportunities for ${sector.title}`)
    }

    const handleStartJourney = () => {
        if (!business) {
            setProfileModalOpen(true)
        } else if (!cacApplication || cacApplication.status !== 'approved') {
            setCacModalOpen(true)
        } else if (stepProgress <= 3) {
            setStorefrontModalOpen(true)
        } else {
            handleJourneyContinueSetup()
        }
    }

    const handleJourneyContinueSetup = () => {
        if (!business) {
            setProfileModalOpen(true)
        } else if (!cacApplication || cacApplication.status !== 'approved') {
            setCacModalOpen(true)
        } else if (stepProgress <= 3) {
            setStorefrontModalOpen(true)
        } else if (stepProgress === 4) {
            setSavingsModalOpen(true)
        } else if (stepProgress === 5) {
            setAnnouncementModalOpen(true)
        } else if (stepProgress === 6) {
            setCrowdfundModalOpen(true)
        } else {
            setTradecredModalOpen(true)
        }
    }

    const handleJourneySelectStep = (stepId: number) => {
        switch (stepId) {
            case 1:
                setProfileModalOpen(true)
                break
            case 2:
                if (!business) {
                    toast.info('Complete Step 1: Business Profile setup first.')
                    setProfileModalOpen(true)
                } else if (cacApplication?.status === 'approved') {
                    setCertModalOpen(true)
                } else {
                    setCacModalOpen(true)
                }
                break
            case 3:
                if (cacApplication?.status !== 'approved') {
                    toast.info('Step 3 unlocks once your Hubnovo registration is approved.')
                    setCacModalOpen(true)
                } else {
                    setStorefrontModalOpen(true)
                }
                break
            case 4:
                setSavingsModalOpen(true)
                break
            case 5:
                setAnnouncementModalOpen(true)
                break
            case 6:
                setCrowdfundModalOpen(true)
                break
            case 7:
                setTradecredModalOpen(true)
                break
            default:
                break
        }
    }

    return (
        <main className="w-full min-h-[calc(100dvh-4rem)] bg-background text-foreground pb-12">
            <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
                {/* ── Hero Banner ── */}
                <LaunchpadHero onStartJourney={handleStartJourney} />

                {/* ── Main 2-Column Dashboard Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] gap-6 items-start">
                    {/* ── LEFT / MAIN COLUMN ── */}
                    <div className="min-w-0 space-y-6">
                        {/* 1. 5-Stage Lifecycle Stepper */}
                        <LaunchpadRoadmapStepper
                            activeStageId={activeStageId}
                            onSelectStage={handleSelectStage}
                        />

                        {/* 2. Step 2 Spotlight: Facilitated CAC Registration & Tracker Card */}
                        <CacStatusTrackerCard
                            business={business}
                            application={cacApplication}
                            onStartCac={() => {
                                if (!business) {
                                    toast.info('Please set up your business profile first.')
                                    setProfileModalOpen(true)
                                } else {
                                    setCacModalOpen(true)
                                }
                            }}
                            onViewCertificate={() => setCertModalOpen(true)}
                            onApplicationUpdated={(app) => {
                                setCacApplication(app)
                                if (app.status === 'approved') {
                                    setStepProgress((prev) => Math.max(prev, 3))
                                    setActiveStageId(4)
                                }
                            }}
                        />

                        {/* 3. 5 Core Quick-Action Cards */}
                        <LaunchpadActionCards onSelectAction={handleSelectAction} />

                        {/* 4. Business Templates Grid */}
                        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                            <LaunchpadTemplates
                                onUseTemplate={(tpl) => setSelectedTemplate(tpl)}
                                onSeeAll={() => setSelectedTemplate(BUSINESS_TEMPLATES[0])}
                            />
                        </div>

                        {/* 5. Tools & Resources Grid */}
                        <LaunchpadToolsResources
                            onSelectTool={(tool) => setSelectedTool(tool)}
                            onSeeAll={() => setSelectedTool(TOOLS_AND_RESOURCES[0])}
                        />

                        {/* 6. Featured Business Sectors */}
                        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                            <LaunchpadSectors
                                onSelectSector={handleSelectSector}
                                onSeeAll={() => toast.success('Showing all 8 business sectors')}
                            />
                        </div>

                        {/* 7. Bottom Banner / Callout */}
                        <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative z-10 max-w-lg">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-emerald-200 mb-2">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Ideas Today. Businesses Tomorrow.</span>
                                </span>
                                <h3 className="text-lg sm:text-xl font-black">
                                    Ready to turn your vision into an established enterprise?
                                </h3>
                                <p className="text-xs text-white/80 mt-1">
                                    Get step-by-step assistance, funding eligibility checks, and Hubnovo enterprise registration for ₦5,000.
                                </p>
                            </div>
                            <button
                                onClick={handleStartJourney}
                                className="relative z-10 shrink-0 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                                <span>{business ? 'Manage Business' : 'Start Now'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN / SIDEBAR RAIL ── */}
                    <div className="w-full space-y-5 lg:sticky lg:top-20">
                        {/* 1. Your Business Journey Tracker */}
                        <LaunchpadJourneyTracker
                            business={business}
                            cacApplication={cacApplication}
                            stepProgress={stepProgress}
                            onContinueSetup={handleJourneyContinueSetup}
                            onSelectStep={handleJourneySelectStep}
                            onViewAll={() => toast.success('Viewing full 7-step milestone breakdown')}
                        />

                        {/* 2. Funding Opportunities */}
                        <LaunchpadFundingOpportunities
                            onSelectFunding={(opportunity) => setSelectedFunding(opportunity)}
                            onSeeAll={() => setSelectedFunding(FUNDING_OPPORTUNITIES[0])}
                        />

                        {/* 3. Success Stories Testimonial Carousel */}
                        <LaunchpadSuccessStories
                            onSeeAll={() => toast.success('Viewing all entrepreneur success stories')}
                        />

                        {/* 4. Need Guidance Advisory Card */}
                        <LaunchpadAdvisoryCard
                            onBookSession={() => setAdvisoryOpen(true)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Step 1: Business Profile Setup Wizard ── */}
            <BusinessProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                existingBusiness={business}
                onSaved={(b) => {
                    setBusiness(b)
                    setStepProgress((prev) => Math.max(prev, 2))
                    setActiveStageId(2)
                }}
                onProceedToCac={() => {
                    setCacModalOpen(true)
                }}
            />

            {/* ── Step 2: CAC Facilitated Registration Intake ── */}
            <CacRegistrationModal
                isOpen={cacModalOpen}
                onClose={() => setCacModalOpen(false)}
                business={business}
                walletBalance={walletBalance}
                onSubmitted={(app) => {
                    setCacApplication(app)
                    setWalletBalance((prev) => Math.max(0, prev - 5000))
                }}
                onOpenProfileSetup={() => setProfileModalOpen(true)}
            />

            {/* ── Step 2 Output: CAC Official Certificate Modal ── */}
            <CacCertificateModal
                isOpen={certModalOpen}
                onClose={() => setCertModalOpen(false)}
                application={cacApplication}
                business={business}
            />

            {/* ── Step 3: Digital Storefront Modal ── */}
            <DigitalStorefrontModal
                isOpen={storefrontModalOpen}
                onClose={() => setStorefrontModalOpen(false)}
                business={business}
                cacApplication={cacApplication}
                onCreated={() => {
                    setStepProgress((prev) => Math.max(prev, 4))
                    if (business) {
                        setBusiness({ ...business, step_progress: Math.max(business.step_progress || 0, 4) })
                    }
                }}
                onProceedToNext={() => {
                    setSavingsModalOpen(true)
                }}
            />

            {/* ── Step 4: Business Savings Goal Modal ── */}
            <BusinessSavingsGoalModal
                isOpen={savingsModalOpen}
                onClose={() => setSavingsModalOpen(false)}
                business={business}
                walletBalance={walletBalance}
                onGoalCreated={() => {
                    setStepProgress((prev) => Math.max(prev, 5))
                    if (business) {
                        setBusiness({ ...business, step_progress: Math.max(business.step_progress || 0, 5) })
                    }
                }}
                onProceedToNext={() => {
                    setAnnouncementModalOpen(true)
                }}
            />

            {/* ── Step 5: Launch Announcement Broadcast Modal ── */}
            <LaunchAnnouncementModal
                isOpen={announcementModalOpen}
                onClose={() => setAnnouncementModalOpen(false)}
                business={business}
                cacApplication={cacApplication}
                onBroadcasted={() => {
                    setStepProgress((prev) => Math.max(prev, 6))
                    if (business) {
                        setBusiness({ ...business, step_progress: Math.max(business.step_progress || 0, 6) })
                    }
                }}
                onProceedToNext={() => {
                    setCrowdfundModalOpen(true)
                }}
            />

            {/* ── Step 6: CommunityFund Crowdfund Modal ── */}
            <CommunityFundModal
                isOpen={crowdfundModalOpen}
                onClose={() => setCrowdfundModalOpen(false)}
                business={business}
                onCreated={() => {
                    setStepProgress((prev) => Math.max(prev, 7))
                    if (business) {
                        setBusiness({ ...business, step_progress: Math.max(business.step_progress || 0, 7) })
                    }
                }}
                onProceedToNext={() => {
                    setTradecredModalOpen(true)
                }}
            />

            {/* ── Step 7: TradeCred SME Rating Modal ── */}
            <TradeCredScoreModal
                isOpen={tradecredModalOpen}
                onClose={() => setTradecredModalOpen(false)}
                business={business}
                cacApplication={cacApplication}
                onUnlocked={() => {
                    setStepProgress(7)
                    if (business) {
                        setBusiness({ ...business, step_progress: 7, stage: 'scaling' })
                    }
                }}
            />

            {/* ── Additional Launchpad Resources Modals ── */}
            <BusinessTemplateModal
                template={selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
            />

            <BusinessToolModal
                tool={selectedTool}
                onClose={() => setSelectedTool(null)}
            />

            <FundingApplicationModal
                opportunity={selectedFunding}
                onClose={() => setSelectedFunding(null)}
            />

            <AdvisoryBookingModal
                open={advisoryOpen}
                onClose={() => setAdvisoryOpen(false)}
            />
        </main>
    )
}