import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignById, fetchFundingCategories } from '@/lib/actions/funding'
import FundingEditForm from '@/components/app/funding/FundingEditForm'
import { ArrowLeft, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface EditFundingPageProps {
  params: Promise<{ id: string }>
}

export default async function EditFundingPage({ params }: EditFundingPageProps) {
  const { id } = await params

  const [campaign, categories, supabase] = await Promise.all([
    fetchCampaignById(id),
    fetchFundingCategories(),
    createClient(),
  ])

  if (!campaign) {
    notFound()
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/auth/login?next=/app/funding/edit/${id}`)
  }

  if (authUser.id !== campaign.user_id) {
    redirect(`/app/funding/${id}`)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/app/funding/${campaign.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaign
        </Link>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Manage Initiative
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Edit Campaign
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the details, impact statement, goal amount, or cover media of your campaign.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-sm">
        <FundingEditForm campaign={campaign} categories={categories} />
      </div>
    </main>
  )
}
