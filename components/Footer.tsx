'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Linkedin, Instagram, ArrowUpRight, ArrowUp } from 'lucide-react'

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
]

const footerLinks = [
  {
    heading: 'Platform',
    links: [
      { label: 'Social Feed', href: '/auth/signup' },
      { label: 'Crowdfunding', href: '/auth/signup' },
      { label: 'Digital Wallet', href: '/auth/signup' },
      { label: 'Live Chat', href: '/auth/signup' },
      { label: 'Learn & Earn', href: '/auth/signup' },
      { label: 'Services', href: '/auth/signup' },
    ],
  },
  {
    heading: 'Fintech',
    links: [
      { label: 'NaijaAjo', href: '/auth/signup' },
      { label: 'NaijaSafe', href: '/auth/signup' },
      { label: 'TradeCred', href: '/auth/signup' },
      { label: 'NaijaCredit', href: '/auth/signup' },
      { label: 'NaijaInsure', href: '/auth/signup' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Community', href: '#testimonials' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
]

export default function Footer()
{
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden">
      {/* Gradient top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, #00A86B 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      <div className="container-gutter mx-auto max-w-7xl py-16 relative">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14 pb-14 border-b border-white/10">
          {/* Brand col — takes 2 cols on lg */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image src="/logo.png" alt="Hubnovo" width={40} height={40} className="rounded-xl" />
              <Image src="/logo-wordmark.png" alt="Hubnovo" width={120} height={40} className="h-8 w-auto" />
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The all-in-one social impact platform for Nigerian communities — connect, save, learn,
              and grow together.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 pt-1">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors duration-200"
              >
                Get Started
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social, index) =>
              {
                const Icon = social.icon
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary/30 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-10 mb-14 pb-14 border-b border-white/10">
          {[
            { number: '50K+', label: 'Active members' },
            { number: '₦2B+', label: 'Transacted' },
            { number: '100+', label: 'Projects funded' },
            { number: '36', label: 'States covered' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.number}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} HubNovo. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
            aria-label="Back to top"
          >
            Back to top <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
