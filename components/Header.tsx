'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Header()
{
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() =>
  {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Fintech', href: '#fintech' },
    { label: 'Community', href: '#testimonials' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-3'
        }`}
    >
      <div className="container-gutter mx-auto max-w-7xl">
        <nav
          className={`flex items-center justify-between px-5 h-14 rounded-2xl transition-all duration-500 ${scrolled
            ? 'bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg shadow-black/5'
            : 'bg-white/90 backdrop-blur-md border border-gray-200/70 shadow-sm'
            }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image src="/logo.png" alt="Hubnovo" width={36} height={36} className="rounded-lg" priority />
            <Image
              src="/logo-wordmark.png"
              alt="Hubnovo"
              width={96}
              height={32}
              className="h-7 w-auto hidden sm:inline"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-1.5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:text-secondary hover:bg-white transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-secondary hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-colors duration-200"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-2.5 text-secondary hover:bg-gray-100 rounded-xl transition-colors touch-manipulation"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {isOpen && (
          <div
            id="mobile-menu"
            className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-1 border-t border-gray-100 mt-1 space-y-1">
                <Link
                  href="/auth/login"
                  className="block px-4 py-2.5 text-secondary hover:bg-gray-100 rounded-xl text-sm font-semibold text-center touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2.5 bg-secondary text-white font-semibold rounded-xl text-center text-sm touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
