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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'
        }`}
    >
      <div className="container-gutter mx-auto max-w-7xl">
        <nav
          className={`flex items-center justify-between px-5 h-14 rounded-2xl transition-all duration-500 ${scrolled
            ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-slate-700/40 shadow-lg shadow-black/5'
            : 'bg-transparent'
            }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="HubNovo"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="font-bold text-[15px] text-gray-900 dark:text-white tracking-tight hidden sm:inline">
            HubNovo
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl px-2 py-1.5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-manipulation"
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
            className="md:hidden mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-slate-700/40 rounded-2xl shadow-xl overflow-hidden"
          >            <div className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-medium touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-1 border-t border-gray-100 dark:border-slate-800 mt-1 space-y-1">
                <Link
                  href="/auth/login"
                  className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-center touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-center text-sm touch-manipulation"
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
