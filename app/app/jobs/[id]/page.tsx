import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchJobById, fetchEmployerJobsWithApplicants } from '@/lib/actions/jobs'
import JobDetailClient from '@/components/app/market/jobs/JobDetailClient'
import type { JobApplication } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const job = await fetchJobById(id)
  if (!job) return { title: 'Job Not Found | Hubnovo' }
  return {
    title: `${job.title} at ${job.company_name} | Hubnovo`,
    description: job.description.slice(0, 160),
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await fetchJobById(id)

  if (!job) {
    notFound()
  }

  const { profile: userProfile } = await getCurrentUser()

  let employerApplications: JobApplication[] = []

  // If user is the employer of this job, load the candidate applications
  if (userProfile && job.employer_id === userProfile.id) {
    const { applications } = await fetchEmployerJobsWithApplicants()
    employerApplications = applications.filter((a) => a.job_id === job.id)
  }

  return (
    <JobDetailClient
      job={job}
      currentUser={userProfile}
      employerApplications={employerApplications}
    />
  )
}
