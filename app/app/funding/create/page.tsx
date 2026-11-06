import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchFundingCategories } from '@/lib/actions/funding'
import CreateCampaignClient from '@/components/app/funding/CreateCampaignClient'
import { ArrowLeft, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CreateFundingPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login?next=/app/funding/create')
  }

  const [{ data: userProfile }, categories] = await Promise.all([
    supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .or(`id.eq.${authUser.id},auth_id.eq.${authUser.id}`)
      .maybeSingle(),
    fetchFundingCategories(),
  ])

  const currentUser = {
    username: userProfile?.username || 'member',
    display_name: userProfile?.display_name || 'Community Member',
    avatar_url: userProfile?.avatar_url ?? null,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/app/funding"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Crowdfunding
        </Link>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Start an Initiative
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Create a Campaign or Project
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Rally support from fellow Nigerians and international backers to fund your idea, community cause, or venture.
        </p>
      </div>

      <CreateCampaignClient
        categories={categories}
        currentUser={currentUser}
      />
    </main>
  )
}
