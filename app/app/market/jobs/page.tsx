import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchJobs } from '@/lib/actions/jobs'
import JobsMarketClient from '@/components/app/market/jobs/JobsMarketClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Jobs & Careers | Hubnovo Marketplace',
  description: 'Find top job opportunities or hire skilled professionals on Hubnovo.',
}

export default async function JobsPage() {
  const { profile: userProfile } = await getCurrentUser()

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
