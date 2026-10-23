import { NextRequest, NextResponse } from 'next/server'
import { ALL_MASCOT_LOOKS } from '@/lib/mascot/config'

interface RequestPayload {
  message: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  screenPath?: string
  mascotId?: string
  userName?: string
  userRole?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestPayload = await req.json()
    const {
      message = '',
      history = [],
      screenPath = '/app',
      mascotId = 'portal-guide',
      userName = 'friend',
      userRole = 'community member'
    } = body

    const cleanMsg = message.trim()
    if (!cleanMsg) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    const currentLook =
      ALL_MASCOT_LOOKS.find((m) => m.id === mascotId) || ALL_MASCOT_LOOKS[0]

    // 1. Check for Gemini API Key
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey) {
      try {
        const systemPrompt = `You are ${currentLook.name} (${currentLook.role}), the friendly animated AI companion for HubNovo (NaijaImpact).
HubNovo empowers Nigerian entrepreneurs, artisans, freelancers, jobseekers, and community changemakers through technology, funding, fintech, verified skills, and education.
User info: Name: ${userName}, Role: ${userRole}.
Current screen: ${screenPath}.
Persona: Warm, empowering, practical, articulate, proud of Nigerian excellence. Speak with professional yet friendly tone. Use Nigerian context (Naira ₦, states like Lagos/Abuja/Rivers/Kano/Enugu, local business realities, CAC verification, Paystack, escrow safety).
Formatting: Keep answers concise, highly readable, use bullet points, bold key terms, and end with 2-3 short suggested next actions.
Do not hallucinate or reveal API keys.`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                ...history.slice(-6).map((h) => ({
                  role: h.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: h.content }]
                })),
                { role: 'user', parts: [{ text: cleanMsg }] }
              ],
              generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7
              }
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'I am here to help you navigate HubNovo!'
          return NextResponse.json({
            reply,
            suggestions: generateFollowUps(cleanMsg, screenPath),
            mascotId: currentLook.id
          })
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local engine:', err)
      }
    }

    // 2. Check for OpenAI API Key
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        const systemPrompt = `You are ${currentLook.name} (${currentLook.role}), the animated companion on HubNovo (NaijaImpact) in Nigeria. Current screen: ${screenPath}. User: ${userName}. Provide helpful, structured, concise advice with Nigerian context and bullet points.`
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h) => ({
                role: h.role,
                content: h.content
              })),
              { role: 'user', content: cleanMsg }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          const reply = data.choices?.[0]?.message?.content
          if (reply) {
            return NextResponse.json({
              reply,
              suggestions: generateFollowUps(cleanMsg, screenPath),
              mascotId: currentLook.id
            })
          }
        }
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local engine:', err)
      }
    }

    // 3. Fallback: Intelligent Local Nigerian Context Engine
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
