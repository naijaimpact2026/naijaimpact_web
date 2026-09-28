import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateJobForm from '@/components/app/market/jobs/CreateJobForm'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Post a Job Opening | Hubnovo',
  description: 'Post job opportunities and recruit top talent on Hubnovo.',
}

export default async function CreateJobPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login?next=/app/market/jobs/create')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .maybeSingle()

  if (!profile) {
    redirect('/auth/login')
  }

  return <CreateJobForm currentUser={profile as User} />
}
