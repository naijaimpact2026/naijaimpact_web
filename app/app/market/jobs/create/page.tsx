import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import CreateJobForm from '@/components/app/market/jobs/CreateJobForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Post a Job Opening | Hubnovo',
  description: 'Post job opportunities and recruit top talent on Hubnovo.',
}

export default async function CreateJobPage() {
  const { authUser, profile } = await getCurrentUser()

  if (!authUser) {
    redirect('/auth/login?next=/app/market/jobs/create')
  }

  if (!profile) {
    redirect('/auth/login')
  }

  return <CreateJobForm currentUser={profile} />
}
