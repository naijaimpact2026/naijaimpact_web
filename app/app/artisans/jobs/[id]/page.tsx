import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { fetchJobDetail } from '@/lib/actions/artisan-jobs'
import { fetchWallet } from '@/lib/actions/wallet'
import { hasWalletPin } from '@/lib/wallet-pin'
import JobDetailClient from '@/components/app/artisans/jobs/JobDetailClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Job | Hubnovo' }

export default async function ArtisanJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { authUser, profile } = await getCurrentUser()
  if (!authUser || !profile) redirect(`/auth/login?next=/app/artisans/jobs/${id}`)

  const [detail, { wallet }, hasPin] = await Promise.all([fetchJobDetail(id), fetchWallet(1), hasWalletPin(profile.id)])
  if (!detail) notFound()

  return <JobDetailClient detail={detail} walletBalanceNGN={Number(wallet.balance) || 0} hasPin={hasPin} />
}
