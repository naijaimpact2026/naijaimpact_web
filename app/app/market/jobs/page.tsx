import { createClient } from '@/lib/supabase/server'
import { fetchJobs } from '@/lib/actions/jobs'
import JobsMarketClient from '@/components/app/market/jobs/JobsMarketClient'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Jobs & Careers | Hubnovo Marketplace',
  description: 'Find top job opportunities or hire skilled professionals on Hubnovo.',
}

export default async function JobsPage() {
  const supabase = await createClient()

  // Authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let userProfile: User | null = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle()
    userProfile = data ?? null
  }

  // Fetch initial active jobs
  const { jobs, nextCursor, totalCount } = await fetchJobs({}, 20)

  return (
    <JobsMarketClient
      initialJobs={jobs}
      initialNextCursor={nextCursor}
      totalCount={totalCount}
      currentUser={userProfile}
    />
  )
}
