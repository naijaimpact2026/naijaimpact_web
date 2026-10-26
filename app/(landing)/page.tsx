import Header from '@/components/Header'
import Hero from '@/components/Hero'
import FeatureShowcase from '@/components/FeatureShowcase'
import Features from '@/components/Features'
import ComingSoon from '@/components/ComingSoon'
import About from '@/components/About'
import HowItWorks from '@/components/HowItWorks'
import Security from '@/components/Security'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import NovoCompanion from '@/components/app/mascot'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const code = typeof resolvedParams.code === 'string' ? resolvedParams.code : undefined
  const next = typeof resolvedParams.next === 'string' ? resolvedParams.next : undefined

  // If OAuth code landed on root landing page, forward directly to /auth/callback
  if (code) {
    const nextQuery = next ? `&next=${encodeURIComponent(next)}` : ''
    redirect(`/auth/callback?code=${encodeURIComponent(code)}${nextQuery}`)
  }

  // If already logged in, navigate straight to /app
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/app')
  }

  // Landing is light-locked: explicit bg/text so html.dark tokens never leak in.
  return (
    <main className="bg-white text-ink [color-scheme:light]">
      <Header />
      <Hero />
      <FeatureShowcase />
      <Features />
      <ComingSoon />
      <HowItWorks />
      <Security />
      <About />
      <FAQ />
      <Contact />
      <Footer />
      <NovoCompanion user={null} />
    </main>
  )
}

