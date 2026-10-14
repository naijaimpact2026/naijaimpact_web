import Link from 'next/link'
import Image from 'next/image'

const columns = [
  {
    heading: 'Products',
    links: [
      { label: 'NaijaSafe', href: '#products' },
      { label: 'NaijaAjo', href: '#products' },
      { label: 'TradeCred', href: '#products' },
      { label: 'NaijaCredit', href: '#products' },
      { label: 'NaijaInsure', href: '#products' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Social feed', href: '#community' },
      { label: 'Crowdfunding', href: '#community' },
      { label: 'Learn and earn', href: '#community' },
      { label: 'Services', href: '#community' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Security', href: '#security' },
      { label: 'FAQs', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Child safety', href: '/child-safety' },
      { label: 'Delete your account', href: '/delete-account' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-mist text-ink">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Hubnovo home">
              <Image src="/logo-mark.png" alt="" width={34} height={32} />
              <Image src="/logo-wordmark.png" alt="Hubnovo" width={90} height={30} />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              Savings, ajo, credit and community in one app. Built in Nigeria, for Nigerians.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hubnovo. All rights reserved.</p>
          <p>People. Opportunities. Prosperity.</p>
        </div>
      </div>
    </footer>
  )
}
