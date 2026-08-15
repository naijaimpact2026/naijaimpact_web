import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import FintechSection from '@/components/FintechSection'
import About from '@/components/About'
import Testimonials from '@/components/Testimonials'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home()
{
  return (
    <main>
      <Header />
      <Hero />
      <Features />
      <FintechSection />
      <About />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  )
}
