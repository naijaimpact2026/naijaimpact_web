'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowRight, ArrowUpRight } from 'lucide-react'

export default function Contact()
{
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
  {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) =>
  {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() =>
    {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email us',
      value: 'hello@hubnovo.com',
      href: 'mailto:hello@hubnovo.com',
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      icon: Phone,
      label: 'Call us',
      value: '+234 (0) 901 234 5678',
      href: 'tel:+2349012345678',
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      icon: MapPin,
      label: 'Visit us',
      value: 'Lagos, Nigeria',
      href: '#',
      gradient: 'from-rose-400 to-pink-500',
    },
  ]

  const inputClass = (name: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-slate-800/50 transition-all duration-200 outline-none ${focused === name
      ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-800'
      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
    }`

  return (
    <section id="contact" className="relative py-24 md:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white dark:bg-slate-900" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 opacity-10 dark:opacity-5"
          style={{
            background: 'radial-gradient(circle, hsl(199,100%,43%) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="container-gutter mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div className="space-y-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                Get in Touch
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {"Let's build"}
                <br />
                <span
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, hsl(166,76%,40%), hsl(199,100%,43%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  something great
                </span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                Have questions, partnership ideas, or just want to say hi? We would love to hear
                from you.
              </p>
            </div>

            {/* Quick auth shortcuts */}
            <div className="flex gap-3">
              <Link
                href="/auth/signup"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-200"
              >
                Create account
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Sign in
              </Link>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              {contactInfo.map((info, index) =>
              {
                const Icon = info.icon
                return (
                  <a
                    key={index}
                    href={info.href}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                        {info.label}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {info.value}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Right — Form */}
          <div className="bento-card noise-bg p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Send a message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="Your name"
                    className={inputClass('name')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="your@email.com"
                    className={inputClass('email')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setFocused('subject')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="What is this about?"
                  className={inputClass('subject')}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  required
                  rows={4}
                  placeholder="Your message here..."
                  className={`${inputClass('message')} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={submitted}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01] transition-all duration-200 text-sm disabled:opacity-70 disabled:scale-100"
              >
                {submitted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Message Sent!
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
