'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Products', href: '#products' },
  { label: 'Community', href: '#community' },
  { label: 'Security', href: '#security' },
  { label: 'About', href: '#about' },
  { label: 'FAQs', href: '#faq' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || isOpen
          ? 'border-b border-line bg-white/95 backdrop-blur'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Hubnovo home">
          <Image src="/logo-mark.png" alt="" width={34} height={32} priority />
          <Image
            src="/logo-wordmark.png"
            alt="Hubnovo"
            width={90}
            height={30}
            className="h-[30px] w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[15px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-brand px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Create free account
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="-mr-2 rounded-lg p-2 text-ink transition-colors hover:bg-ink/5 lg:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="border-t border-line bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-mist"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-line px-4 py-3 text-center text-sm font-semibold text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
