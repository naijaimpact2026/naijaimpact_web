import type { Metadata, Viewport } from 'next'
import { Archivo, Public_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastViewport } from '@/components/toast'
import './globals.css'

// Both families ship the Naira sign (₦), but only in their latin-ext
// subset — dropping 'latin-ext' makes every ₦ fall back to a system font.
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-heading',
})

const publicSans = Public_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'HubNovo - Community | Simplified | Technology Solution',
  description: 'Empowering Nigerian communities through technology-driven solutions. Building a simplified ecosystem for community development and impact.',
  keywords: 'Nigeria, Community, Technology, Impact, Development, Solutions',
  generator: 'v0.app',
  openGraph: {
    title: 'HubNovo',
    description: 'Empowering Nigerian communities through technology-driven solutions',
    url: 'https://hubnovo.com',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/logo.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo-darkmode (1).png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#102A43' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>)
{
  return (
    <html lang="en" className={`${archivo.variable} ${publicSans.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <ToastViewport />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
