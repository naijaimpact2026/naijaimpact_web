import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchJobById, fetchEmployerJobsWithApplicants } from '@/lib/actions/jobs'
import JobDetailClient from '@/components/app/market/jobs/JobDetailClient'
import type { User, JobApplication } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await fetchJobById(id)

  if (!job) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let userProfile: User | null = null
  let employerApplications: JobApplication[] = []

  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle()
    userProfile = data ?? null

    // If user is the employer of this job, load the candidate applications
    if (userProfile && job.employer_id === userProfile.id) {
      const { applications } = await fetchEmployerJobsWithApplicants()
      employerApplications = applications.filter((a) => a.job_id === job.id)
    }
  }

  return (
    <JobDetailClient
      job={job}
      currentUser={userProfile}
      employerApplications={employerApplications}
    />
  )
}
