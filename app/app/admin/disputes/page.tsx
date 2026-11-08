import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { normalizeRole } from '@/lib/modushive/config'
import { fetchOpenDisputes } from '@/lib/actions/artisan-jobs'
import DisputesQueueClient from '@/components/app/artisans/jobs/DisputesQueueClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Disputes | Hubnovo Admin' }

export default async function AdminDisputesPage() {
  const { authUser, profile } = await getCurrentUser()
  if (!authUser) redirect('/auth/login?next=/app/admin/disputes')
  if (!profile || normalizeRole(profile.role) !== 'admin') redirect('/app')

  const disputes = await fetchOpenDisputes()
  return <DisputesQueueClient disputes={disputes} />
}
