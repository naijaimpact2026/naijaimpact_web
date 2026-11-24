import { redirect } from 'next/navigation'

/** The 3D Campus is now the competition home; keep old links working. */
export default async function WorldMapPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ week?: string; district?: string }> })
{
    const [{ slug }, sp] = await Promise.all([params, searchParams])
    const q = new URLSearchParams()
    if (sp.week) q.set('week', sp.week)
    if (sp.district) q.set('district', sp.district)
    redirect(`/app/competitions/${slug}${q.size ? `?${q}` : ''}`)
}
