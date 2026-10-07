import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MarketArtisanProfileRedirect({ params }: { params: Promise<{ artisanKey: string }> }) {
  const { artisanKey } = await params
  redirect(`/app/artisans/profile/${artisanKey}`)
}
