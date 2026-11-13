import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ALL_MASCOT_LOOKS } from '@/lib/mascot/config'
import type { MascotLook } from '@/lib/mascot/types'
import { getRequestUser } from '@/lib/supabase/request-auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface RequestPayload {
  message: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  screenPath?: string
  mascotId?: string
  userName?: string
  userRole?: string
}

const MODEL = 'claude-opus-5-5'
const MAX_MESSAGE_CHARS = 2000
const RATE_LIMITED_REPLY = 'Novo needs a quick breather — please try again in a minute.'

// Created once per server instance; reads ANTHROPIC_API_KEY from the environment.
let client: Anthropic | null = null
function getClaude(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  client ??= new Anthropic()
  return client
}

function systemPrompt(look: MascotLook, userName: string, userRole: string, screenPath: string): string {
  return `You are ${look.name} (${look.role}), the friendly AI companion inside HubNovo, a Nigerian community platform.

What is live on HubNovo today: the community feed and topic communities, chat and group chats, Livestream (NovoStream), the Wallet (add money, send, withdraw, and pay artisans), Learn (courses, including ones members create), the Marketplace and storefronts, Artisans & Pros, Jobs & Careers, Business LaunchPad (business profiles and CAC registration help), and search.
Coming soon, NOT available yet: savings, ajo circles, credit and micro-loans, and crowdfunding. If asked about these, say they are coming soon. Never describe them as working or walk someone through using them.

Persona: warm, practical and encouraging, proud of Nigerian excellence. Use Nigerian context where it helps (Naira ₦, Lagos/Abuja/Kano/Enugu, CAC, local business realities).
Style: concise and easy to scan on a phone. Use short paragraphs or a few bullet points and bold the key terms. End with 2-3 short suggested next steps in the app.
Only answer from what you know about HubNovo and general knowledge. If you are unsure whether a HubNovo feature exists, say so rather than guessing.

The user is ${userName} (${userRole}). They are on the screen ${screenPath}.`
}

/** Last 6 turns, text only, starting with a user turn (the API requires it). */
function toMessages(history: RequestPayload['history'], message: string): Anthropic.Beta.BetaMessageParam[] {
  const turns: Anthropic.Beta.BetaMessageParam[] = (Array.isArray(history) ? history : [])
    .filter((h) => (h?.role === 'user' || h?.role === 'assistant') && typeof h.content === 'string' && h.content.trim())
    .slice(-6)
    .map((h) => ({ role: h.role, content: h.content.slice(0, MAX_MESSAGE_CHARS) }))
  while (turns.length && turns[0].role !== 'user') turns.shift()
  turns.push({ role: 'user', content: message })
  return turns
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestPayload = await req.json()
    const {
      message = '',
      history = [],
      screenPath = '/app',
      mascotId = 'portal-guide',
    } = body

    const cleanMsg = String(message).trim().slice(0, MAX_MESSAGE_CHARS)
    if (!cleanMsg) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    // Signed-in users (web cookie or mobile bearer token) are limited per
    // account; landing-page visitors per IP. Every message costs an AI call.
    const { profile } = await getRequestUser(req)
    const allowed = profile
      ? await rateLimit(`novo:user:${profile.id}`, 30, 60, { failOpen: true })
      : await rateLimit(`novo:ip:${await clientIp(req)}`, 8, 60, { failOpen: true })
    if (!allowed) {
      return NextResponse.json({ error: RATE_LIMITED_REPLY }, { status: 429 })
    }

    // Trust the account over the request body for who the user is.
    const userName = profile?.display_name?.split(' ')[0] || (profile ? 'friend' : body.userName || 'friend')
    const userRole = profile?.role || 'visitor'

    const currentLook =
      ALL_MASCOT_LOOKS.find((m) => m.id === mascotId) || ALL_MASCOT_LOOKS[0]

    const claude = getClaude()
    if (claude) {
      try {
        const response = await claude.beta.messages.create({
          model: MODEL,
          max_tokens: 4096,
          // Opus 5.5 always thinks; low effort keeps chat replies quick.
          output_config: { effort: 'low' },
          // If Claude declines on safety grounds, the API retries on a fallback model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: systemPrompt(currentLook, userName, userRole, String(screenPath).slice(0, 200)),
          messages: toMessages(history, cleanMsg),
        })

        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')
          .trim()

        if (response.stop_reason !== 'refusal' && reply) {
          return NextResponse.json({
            reply,
            suggestions: generateFollowUps(cleanMsg, screenPath),
            mascotId: currentLook.id
          })
        }
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          console.warn('[novo] Claude rate limited, using local engine')
        } else if (err instanceof Anthropic.APIError) {
          console.error(`[novo] Claude API error ${err.status}:`, err.message)
        } else {
          console.error('[novo] Claude call failed:', err)
        }
      }
    }

    // Fallback: local Nigerian-context answer engine (no key, refusal, or API error)
    const localResponse = generateLocalResponse(cleanMsg, screenPath, currentLook, userName)
    return NextResponse.json({
      reply: localResponse.reply,
      suggestions: localResponse.suggestions,
      mascotId: currentLook.id
    })
  } catch (error) {
    console.error('AI Companion Error:', error)
    return NextResponse.json(
      {
        reply:
          'E pele! I encountered a slight hiccup processing that. Please try rephrasing or ask one of the quick suggestions below!',
        suggestions: [
          'How do I qualify for grants?',
          'Find verified artisans',
          'Explain escrow payments'
        ]
      },
      { status: 500 }
    )
  }
}

/**
 * Rich, context-aware rule engine tailored for HubNovo modules and Nigerian business realities.
 */
function generateLocalResponse(
  query: string,
  screenPath: string,
  look: (typeof ALL_MASCOT_LOOKS)[0],
  userName: string
): { reply: string; suggestions: string[] } {
  const q = query.toLowerCase()

  // 1. Funding, Grants & Investors
  if (
    q.includes('grant') ||
    q.includes('fund') ||
    q.includes('invest') ||
    q.includes('pitch') ||
    q.includes('capital') ||
    screenPath.includes('funding')
  ) {
    if (q.includes('qualify') || q.includes('criteria') || q.includes('apply')) {
      return {
        reply: `### 🎯 How to Qualify for HubNovo Community Grants & Seed Funding

Hello ${userName}! Here is the roadmap to maximize your grant eligibility on HubNovo:

1. **Complete Profile & CAC Status:** Ensure your business or project has verified details. Even registered business names (BN) or incorporated trustees (IT) receive priority.
2. **Clear Problem Statement:** Highlight the real Nigerian problem you are solving (e.g., renewable energy, local agricultural value-add, tech education).
3. **Transparent Financial Milestones:** Break down how the funds (₦500,000 to ₦10,000,000+) will be deployed step-by-step.
4. **Community Backing & Traction:** Projects that share regular updates in the **Community Feed** and gather peer endorsements have a 3x higher approval rate.

> **Pro Tip:** Head over to the **[Funding Launchpad](/app/funding)** to view all active grant windows and start your application!`,
        suggestions: [
          'What makes a winning pitch deck?',
          'How does milestone payout work?',
          'Connect with angel investors'
        ]
      }
    }

    if (q.includes('pitch') || q.includes('deck') || q.includes('video')) {
      return {
        reply: `### 🚀 Winning Pitch Deck Checklist for Nigerian Innovators

Investors and grant committees look for clarity over fluff:

- **Slide 1 — The Hook:** One clear sentence describing your solution.
- **Slide 2 — The Problem in Nigeria:** Quantify the pain (e.g., "70% of artisan jobs experience payment disputes").
- **Slide 3 — The Solution & Product:** Screenshots or prototype photos of what you've built.
- **Slide 4 — Market Size & Unit Economics:** What are your pricing, margins, and revenue model in Naira (₦)?
- **Slide 5 — The Team:** Why is your team uniquely positioned to execute?
- **Slide 6 — The Ask:** Exactly how much capital you need and what milestones it unlocks.

Would you like me to review a specific section of your pitch?`,
        suggestions: [
          'How to calculate project ROI',
          'Apply for current funding',
          'Explore funded projects'
        ]
      }
    }

    return {
      reply: `### 💰 HubNovo Funding & Venture Ecosystem

Welcome to the funding hub! On HubNovo, innovators can tap into:

- **Grassroots Grants:** Non-dilutive community grants up to **₦2,500,000** for high-impact social initiatives.
- **Venture Seed Rounds:** Connect directly with vetted angel syndicates and diaspora investors looking for Nigerian growth startups.
- **Escrow-Protected Backing:** Every pledge is held in secure smart escrow and released only upon verified milestone completion.

You can explore active rounds under **[Explore Funding](/app/funding)**.`,
      suggestions: [
        'How do I apply for a grant?',
        'What documents are required for KYC?',
        'Explain escrow protection'
      ]
    }
  }

  // 2. Fintech, Wallet & Escrow
  if (
    q.includes('wallet') ||
    q.includes('escrow') ||
    q.includes('naira') ||
    q.includes('paystack') ||
    q.includes('withdraw') ||
    q.includes('fee') ||
    q.includes('transfer') ||
    screenPath.includes('fintech') ||
    screenPath.includes('wallet')
  ) {
    if (q.includes('escrow') || q.includes('protect')) {
      return {
        reply: `### 🛡️ How HubNovo Milestone Escrow Protects You

HubNovo Escrow eliminates the age-old Nigerian dilemma of *"pay before work vs. work before pay"*:

1. **Deposit into Escrow:** The client funds the agreed project milestone into secure escrow via Paystack / Bank Transfer.
2. **Work Commences:** The service provider or artisan gets notified that funds are locked and guaranteed.
3. **Inspection & Approval:** Once deliverables are delivered and inspected, the client releases the milestone with their secure Wallet PIN.
4. **Instant Payout:** Funds land instantly in the provider's wallet balance, ready for zero-delay bank withdrawal.

If a dispute arises, HubNovo's trained dispute resolution officers step in within 24 hours to review evidence.`,
        suggestions: [
          'How do I withdraw to my bank?',
          'What are the transaction fees?',
          'How to set up a Wallet PIN'
        ]
      }
    }

    if (q.includes('withdraw') || q.includes('bank') || q.includes('payout')) {
      return {
        reply: `### 🏦 Bank Withdrawals on HubNovo

- **Destination:** Any verified Nigerian commercial bank or licensed digital bank (Access, GTBank, Zenith, Kuda, Moniepoint, OPay, etc.).
- **Processing Time:** Instant to under 5 minutes.
- **Security:** Requires your confidential 4-digit Wallet PIN.
- **Daily Limits:** Tier 1 (BVN/NIN verified) supports up to ₦1,000,000/day. CAC-verified business accounts support up to ₦10,000,000/day.

Visit your **[Wallet Dashboard](/app/wallet)** to check your balance or request a withdrawal!`,
        suggestions: [
          'How to reset my Wallet PIN',
          'Calculate project fees',
          'How does escrow work?'
        ]
      }
    }

    return {
      reply: `### 💳 HubNovo Financial Services & Wallet

Your HubNovo digital wallet handles:
- **Instant Bank Top-ups** via Paystack virtual accounts or debit cards.
- **Zero-Fee Intra-Platform Transfers** to collaborators and verified artisans.
- **Automated Invoicing & Receipts** for your business accounting.

Have a specific transaction question? Just ask!`,
      suggestions: [
        'How does milestone escrow work?',
        'How do I withdraw funds?',
        'View my wallet transactions'
      ]
    }
  }

  // 3. Artisans & Services
  if (
    q.includes('artisan') ||
    q.includes('electrician') ||
    q.includes('plumber') ||
    q.includes('carpenter') ||
    q.includes('mechanic') ||
    q.includes('service') ||
    screenPath.includes('artisans') ||
    screenPath.includes('services')
  ) {
    return {
      reply: `### 🔨 Finding & Hiring Verified Artisans on HubNovo

Quality craftsmanship you can count on across all 36 Nigerian states:

- **Verified Identification:** All featured artisans have completed physical verification, trade guild registration, and government identity checks.
- **Community Ratings & Portfolios:** View real photos of past jobs in Lagos, Abuja, Port Harcourt, and customer feedback.
- **Milestone Agreements:** Never pay 100% upfront for materials. Separate **Material Advance** from **Labour Completion** milestones in escrow.

Ready to book? Explore our directory under **[Find Artisans](/app/artisans)**!`,
      suggestions: [
        'How do artisans get verified?',
        'Create a milestone contract',
        'Find verified electricians near me'
      ]
    }
  }

  // 4. Jobs & Careers
  if (
    q.includes('job') ||
    q.includes('hire') ||
    q.includes('career') ||
    q.includes('resume') ||
    q.includes('cv') ||
    q.includes('interview') ||
    screenPath.includes('jobs')
  ) {
    return {
      reply: `### 💼 Accelerate Your Career with HubNovo Jobs

Whether you are looking for remote tech roles, corporate positions, or looking to recruit top Nigerian talent:

1. **Portfolio Over Promises:** Upload project samples, GitHub links, Figma design links, or verified work history.
2. **Skill Badges:** Complete skill assessments on the **[Learn Academy](/app/learn)** to earn gold badges that recruiters search for.
3. **Fast-Track Matching:** Our algorithm matches candidates based on verified skills and state location.

Browse active vacancies on the **[Job Board](/app/jobs)**!`,
      suggestions: [
        'How to optimize my profile for recruiters',
        'Top in-demand tech skills in Nigeria',
        'Post a job vacancy'
      ]
    }
  }

  // 5. Learning & Academy
  if (
    q.includes('learn') ||
    q.includes('course') ||
    q.includes('certificate') ||
    q.includes('training') ||
    q.includes('academy') ||
    screenPath.includes('learn')
  ) {
    return {
      reply: `### 📚 HubNovo Academy & Masterclasses

Practical, real-world courses created specifically for the African business context:

- **Business Scaling & Financial Management:** Managing working capital, pricing in Naira, and navigating inflation.
- **Tech & Digital Marketing:** Web development, product design, SEO, and paid ad acquisition.
- **Grant Readiness Masterclass:** How to write winning grant applications and present financial audits.
- **Shareable Certificates:** Earn verifiable credentials you can display on your HubNovo profile and LinkedIn.

Start learning today at **[HubNovo Academy](/app/learn)**!`,
      suggestions: [
        'Recommend top entrepreneurship courses',
        'How do I earn certificates?',
        'Apply for grant training'
      ]
    }
  }

  // 6. Security & Settings
  if (
    q.includes('password') ||
    q.includes('security') ||
    q.includes('2fa') ||
    q.includes('two factor') ||
    q.includes('privacy') ||
    screenPath.includes('settings')
  ) {
    return {
      reply: `### 🔒 Account Security & Protection

We keep your account safe with industry-leading encryption:

- **Two-Factor Authentication (2FA):** Enable authenticator app codes (Google Authenticator, Authy) to stop unauthorized logins.
- **Wallet PIN Protection:** Separate 4-digit code required before any fund release or bank withdrawal.
- **Device Management:** Review active logged-in sessions and terminate unrecognized devices instantly.

You can configure these anytime under **[Settings & Security](/app/settings)**.`,
      suggestions: [
        'How do I change my password?',
        'How does identity verification work?',
        'Configure notification alerts'
      ]
    }
  }

  // 7. General Welcome / Tour
  return {
    reply: `### 🌟 Hello ${userName}! I am ${look.name}

I am your dedicated companion on HubNovo. Whether you need help with:

- 🚀 **Funding & Grants:** Pitch deck guidance and applying for capital
- 💰 **Fintech & Escrow:** Protecting transactions and instant bank payouts
- 🔨 **Artisans & Services:** Finding verified Nigerian trade specialists
- 💼 **Jobs & Careers:** Landing high-paying local and remote roles
- 📚 **Academy:** Upskilling with practical African business masterclasses

What would you like to explore first?`,
    suggestions: [
      'What can I do on HubNovo?',
      'How do I qualify for grants?',
      'Find verified artisans near me',
      'Explain milestone escrow'
    ]
  }
}

function generateFollowUps(query: string, screenPath: string): string[] {
  if (screenPath.includes('funding')) {
    return ['How do I apply for active grants?', 'Review my pitch highlights', 'Explore funded ventures']
  }
  if (screenPath.includes('fintech') || screenPath.includes('wallet')) {
    return ['Explain escrow protection', 'How do bank withdrawals work?', 'Calculate project fees']
  }
  if (screenPath.includes('artisans')) {
    return ['Find verified electricians', 'How to write a milestone contract', 'How artisans get vetted']
  }
  if (screenPath.includes('jobs')) {
    return ['How to improve my resume', 'Top in-demand Nigerian tech skills', 'Post a job vacancy']
  }
  if (screenPath.includes('learn')) {
    return ['Recommend free business courses', 'How to earn certificates', 'Grant preparation masterclass']
  }
  return ['Tell me about HubNovo grants', 'How does escrow work?', 'Tour the platform']
}
