import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchMyJobs } from '@/lib/actions/artisan-jobs'
import JobsListClient from '@/components/app/artisans/jobs/JobsListClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My jobs | Hubnovo' }

export default async function ArtisanJobsPage() {
  const { authUser, profile } = await getCurrentUser()
  if (!authUser || !profile) redirect('/auth/login?next=/app/artisans/jobs')

  const { hired, work } = await fetchMyJobs()
  return <JobsListClient hired={hired} work={work} />
}
