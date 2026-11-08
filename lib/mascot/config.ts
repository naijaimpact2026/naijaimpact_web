import { MascotLook } from './types'

export const ALL_MASCOT_LOOKS: MascotLook[] = [
  // ── CORE & PORTAL ───────────────────────────────────────────────
  {
    id: 'portal-guide',
    name: 'Gateway Novo',
    role: 'Hub Navigator & Welcome Guide',
    tagline: 'Welcoming you to the HubNovo ecosystem',
    image: '/mascot/door-portal.png',
    category: 'core',
    matchedRoutes: ['/app'],
    themeColor: '#00A86B',
    glowColor: 'rgba(0, 168, 107, 0.45)',
    badgeText: 'Home Portal',
    welcomeGreeting: 'Welcome back! I am Gateway Novo, your guide across HubNovo. What goal are we conquering today?',
    quickPrompts: [
      'What can I do on HubNovo?',
      'How do I grow my impact score?',
      'Show me top trending opportunities',
      'Give me a 3-minute platform tour'
    ],
    idleTips: [
      '✨ Need help? Tap me anytime for instant assistance!',
      '🌱 Complete your profile to unlock verified trust badges!',
      '🚀 Check out the funding launchpad for active grant cycles!'
    ]
  },
  {
    id: 'chat-bubble',
    name: 'Messenger Novo',
    role: 'Conversational AI & Messenger',
    tagline: 'Direct chat intelligence & collaboration',
    image: '/mascot/chat-bubble.png',
    category: 'core',
    matchedRoutes: ['/app/chat'],
    themeColor: '#00B8D9',
    glowColor: 'rgba(0, 184, 217, 0.45)',
    badgeText: 'Chat Assistant',
    welcomeGreeting: 'Ready to chat! Need help drafting a message, negotiating terms, or communicating with collaborators?',
    quickPrompts: [
      'Draft a polite message to an artisan',
      'How do escrow milestone agreements work in chat?',
      'Help me reply to a client proposal'
    ],
    idleTips: [
      '💬 Clear communication builds lasting business trust!',
      '🔒 Never share banking passwords or OTPs in chat.',
      '🤝 You can invite collaborators to group project chats.'
    ]
  },
  {
    id: 'sentinel-bell',
    name: 'Sentinel Novo',
    role: 'Real-time Alerts & Watcher',
    tagline: 'Keeping you up-to-date on what matters most',
    image: '/mascot/bell-alert.png',
    category: 'core',
    matchedRoutes: ['/app/notifications'],
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    badgeText: 'Notifications',
    welcomeGreeting: 'Ding! Sentinel Novo here keeping guard over your notifications, grants, and message alerts.',
    quickPrompts: [
      'Summarize my recent unread updates',
      'How do I adjust my notification preferences?',
      'When do application deadlines close?'
    ],
    idleTips: [
      '🔔 Enable push alerts so you never miss funding updates!',
      '⚡ Quick responses to clients increase your hire rate by 40%!'
    ]
  },

  // ── FINANCE & TREASURY ──────────────────────────────────────────
  {
    id: 'treasury-jar',
    name: 'Treasury Novo',
    role: 'Funding & Grants Catalyst',
    tagline: 'Nurturing your funding pool & pitch success',
    image: '/mascot/coin-jar.png',
    category: 'finance',
    matchedRoutes: ['/app/funding'],
    themeColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    badgeText: 'Funding Advisor',
    welcomeGreeting: 'E kaabo! Treasury Novo at your service. Let us get your venture funded and community impact scaling.',
    quickPrompts: [
      'How do I qualify for active community grants?',
      'Review my pitch deck key metrics',
      'What are investors in Nigeria looking for?',
      'How does HubNovo equity & grant funding work?'
    ],
    idleTips: [
      '💰 Verified traction metrics make your pitch 3x more compelling!',
      '📈 Seed grants for local innovators are open this quarter.',
      '💡 Transparency in budget allocation attracts higher pledges.'
    ]
  },
  {
    id: 'fintech-calc',
    name: 'Fintech Novo',
    role: 'Financial Planner & ROI Calculator',
    tagline: 'Mastering margins, fees and financial health',
    image: '/mascot/calculator.png',
    category: 'finance',
    matchedRoutes: ['/app/fintech'],
    themeColor: '#00B8D9',
    glowColor: 'rgba(0, 184, 217, 0.5)',
    badgeText: 'Fintech Advisor',
    welcomeGreeting: 'Let us crunch the numbers! I can help you compute project ROI, plan budgets, or understand Naira transactions.',
    quickPrompts: [
      'How does milestone escrow protect my payment?',
      'Calculate estimated profit margin for a project',
      'Explain Paystack and wallet transfer fees',
      'Tips for managing business cash flow in Nigeria'
    ],
    idleTips: [
      '🧮 Always factor in 10-15% buffer for operational contingencies.',
      '🔐 Escrow holds funds safely until both parties sign off.'
    ]
  },
  {
    id: 'vault-wallet',
    name: 'Vault Novo',
    role: 'Naira Vault & Payouts Specialist',
    tagline: 'Securing balances, payouts and escrow',
    image: '/mascot/coin-jar.png',
    category: 'finance',
    matchedRoutes: ['/app/wallet'],
    themeColor: '#8BD450',
    glowColor: 'rgba(139, 212, 80, 0.45)',
    badgeText: 'Wallet Security',
    welcomeGreeting: 'Your funds are safe with Vault Novo! How can I assist with your balance, deposits, or Nigerian bank payouts?',
    quickPrompts: [
      'How do I withdraw funds to my Nigerian bank account?',
      'Why is part of my wallet balance in escrow reserve?',
      'What are the withdrawal limits and processing times?'
    ],
    idleTips: [
      '🏦 Withdrawals to Nigerian commercial banks usually clear in seconds.',
      '🛡️ Keep your Wallet PIN confidential at all times!'
    ]
  },
  {
    id: 'rocket-launch',
    name: 'Rocket Novo',
    role: 'Scale & Launchpad Pilot',
    tagline: 'Propelling your ideas into high orbit',
    image: '/mascot/rocket.png',
    category: 'finance',
    matchedRoutes: ['/app/funding/create', '/app/explore'],
    themeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    badgeText: 'Launchpad',
    welcomeGreeting: '3, 2, 1... Lift off! Rocket Novo is primed to help you launch campaigns, discover projects, and accelerate traction.',
    quickPrompts: [
      'How do I create a high-converting funding campaign?',
      'What video pitch format works best?',
      'Discover top innovative community projects'
    ],
    idleTips: [
      '🚀 Projects with a 60-second video reach their goal 70% faster!',
      '🌟 Early backers often bring the strongest word-of-mouth growth.'
    ]
  },
  {
    id: 'umbrella-cover',
    name: 'Coverage Novo',
    role: 'Risk Protection & Assurance',
    tagline: 'Sheltering your business from unexpected bumps',
    image: '/mascot/umbrella.png',
    category: 'finance',
    matchedRoutes: ['/app/fintech/insurance'],
    themeColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    badgeText: 'Protection',
    welcomeGreeting: 'Rain or shine, Coverage Novo has your back! Ask me about dispute protection, project insurance, and safeguards.',
    quickPrompts: [
      'What happens if a service provider does not deliver?',
      'How does the HubNovo dispute resolution team work?',
      'Are artisan projects insured against damage?'
    ],
    idleTips: [
      '☂️ Milestones keep your capital sheltered until work is inspected!'
    ]
  },
  {
    id: 'grants-gift',
    name: 'Reward Novo',
    role: 'Perks, Grants & Community Rewards',
    tagline: 'Unlocking bonuses for community contributions',
    image: '/mascot/gift-box.png',
    category: 'finance',
    matchedRoutes: ['/app/rewards'],
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    badgeText: 'Rewards',
    welcomeGreeting: 'Special delivery! Reward Novo has unlocked perks and grant opportunities for active community champions.',
    quickPrompts: [
      'How do I earn HubNovo reward points?',
      'What can I redeem with my community credits?',
      'Are there active referral bonuses?'
    ],
    idleTips: [
      '🎁 Completing peer reviews earns bonus reputation badges!'
    ]
  },

  // ── SKILLS & ARTISANS ───────────────────────────────────────────
  {
    id: 'artisan-toolbox',
    name: 'Artisan Novo',
    role: 'Skilled Trade & Craft Specialist',
    tagline: 'Connecting vetted Nigerian artisans and fixers',
    image: '/mascot/toolbox.png',
    category: 'skills',
    matchedRoutes: ['/app/artisans', '/app/services'],
    themeColor: '#00A86B',
    glowColor: 'rgba(0, 168, 107, 0.45)',
    badgeText: 'Artisan Trade',
    welcomeGreeting: 'Tools ready! Artisan Novo here to connect you with verified Nigerian electricians, plumbers, carpenters, and technicians.',
    quickPrompts: [
      'How do I find a certified electrician in Lagos or Abuja?',
      'How do milestone contracts work for physical construction?',
      'How can artisans get verified on HubNovo?',
      'What if materials cost changes during the job?'
    ],
    idleTips: [
      '🔨 Always inspect completed work before releasing the final milestone.',
      '📍 Verified artisans carry physical ID and community rating seals.'
    ]
  },
  {
    id: 'executive-suit',
    name: 'Executive Novo',
    role: 'Career & Talent Coach',
    tagline: 'Connecting top talent with thriving enterprises',
    image: '/mascot/suit-executive.png',
    category: 'skills',
    matchedRoutes: ['/app/jobs'],
    themeColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    badgeText: 'Careers & Talent',
    welcomeGreeting: 'Dressed for impact! Executive Novo is here to boost your hiring strategy or polish your career profile.',
    quickPrompts: [
      'How to make my resume stand out to top recruiters?',
      'What tech & creative skills are in highest demand?',
      'How do employers verify applicant credentials?',
      'Tips for remote work contracts in Nigeria'
    ],
    idleTips: [
      '👔 A detailed project portfolio speaks louder than a 3-page CV.',
      '💼 Employers actively search for candidates with verified endorsements!'
    ]
  },
  {
    id: 'market-scooter',
    name: 'Dispatch Novo',
    role: 'Marketplace Logistics & Trade',
    tagline: 'Fast dispatch and trusted local commerce',
    image: '/mascot/scooter.png',
    category: 'skills',
    matchedRoutes: ['/app/market'],
    themeColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    badgeText: 'Marketplace',
    welcomeGreeting: 'Vroom! Dispatch Novo is ready to speed up your trade, delivery logistics, and product inquiries.',
    quickPrompts: [
      'How does delivery dispatch work across Nigerian states?',
      'How to list my products with buyer escrow protection?',
      'What are the prohibited items in the marketplace?'
    ],
    idleTips: [
      '🛵 Same-day dispatch in major metro areas increases repeat buyers!',
      '📦 Clear product photography boosts conversion rates by 50%.'
    ]
  },
  {
    id: 'folder-docs',
    name: 'Dossier Novo',
    role: 'Proposals & Document Manager',
    tagline: 'Streamlining contracts, tenders and proposals',
    image: '/mascot/folder-docs.png',
    category: 'skills',
    matchedRoutes: ['/app/documents'],
    themeColor: '#0284C7',
    glowColor: 'rgba(2, 132, 199, 0.45)',
    badgeText: 'Documentation',
    welcomeGreeting: 'Everything organized! Dossier Novo helps you structure winning proposals, contracts, and business plans.',
    quickPrompts: [
      'How to format a winning government/NGO grant proposal?',
      'What legal contracts should I use for freelance work?',
      'How do I upload verified business registration (CAC)?'
    ],
    idleTips: [
      '📁 Keeping CAC and TIN documents ready expedites grant verification!'
    ]
  },
  {
    id: 'shield-verified',
    name: 'Verified Novo',
    role: 'Trust & Accreditation Seal',
    tagline: 'Vetting authentic talents and startups',
    image: '/mascot/shield-verified.png',
    category: 'skills',
    matchedRoutes: ['/app/verification'],
    themeColor: '#8BD450',
    glowColor: 'rgba(139, 212, 80, 0.45)',
    badgeText: 'Verification',
    welcomeGreeting: 'Trust is our foundation. Verified Novo verifies credentials, BVN/NIN, and artisan trade certifications.',
    quickPrompts: [
      'How do I get the Verified Gold Badge?',
      'How long does identity verification take?',
      'What are the benefits of a verified account?'
    ],
    idleTips: [
      '🛡️ Verified profiles receive 5x more project inquiries!'
    ]
  },

  // ── COMMUNITY & SETTINGS ────────────────────────────────────────
  {
    id: 'community-heart',
    name: 'Impact Novo',
    role: 'Grassroots & Community Champion',
    tagline: 'Connecting changemakers and grassroots power',
    image: '/mascot/heart-handshake.png',
    category: 'community',
    matchedRoutes: ['/app/feed'],
    themeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    badgeText: 'Community Feed',
    welcomeGreeting: 'Solidarity and strength! Impact Novo connects you with inspiring local initiatives and collaborators.',
    quickPrompts: [
      'How do I post a project update to the community feed?',
      'Find collaborative partners in my state',
      'What community initiatives are trending this week?'
    ],
    idleTips: [
      '🤝 Tag fellow builders to foster collaborative community growth.',
      '❤️ Celebrate small community wins—they inspire the entire ecosystem!'
    ]
  },
  {
    id: 'security-shield',
    name: 'Guardian Novo',
    role: 'Security & Privacy Shield',
    tagline: 'Defending your account, privacy and 2FA',
    image: '/mascot/shield-protect.png',
    category: 'community',
    matchedRoutes: ['/app/settings'],
    themeColor: '#00A86B',
    glowColor: 'rgba(0, 168, 107, 0.45)',
    badgeText: 'Account Shield',
    welcomeGreeting: 'Security protocol active! Guardian Novo is here to help you lock down your account, manage 2FA, and safeguard privacy.',
    quickPrompts: [
      'How do I enable Two-Factor Authentication (2FA)?',
      'How is my personal and financial data stored?',
      'How do I update my password and recovery email?'
    ],
    idleTips: [
      '🔒 A strong passphrase with 2FA prevents 99.9% of account intrusions.'
    ]
  },
  {
    id: 'onboarding-checklist',
    name: 'Checklist Novo',
    role: 'Onboarding & Verification Officer',
    tagline: 'Guiding you through your onboarding steps',
    image: '/mascot/clipboard.png',
    category: 'community',
    matchedRoutes: ['/app/settings/onboarding'],
    themeColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    badgeText: 'Onboarding',
    welcomeGreeting: 'Let us check off your setup! Checklist Novo will walk you step-by-step through profile completion.',
    quickPrompts: [
      'What information do I need for full verification?',
      'Why does profile completeness increase job invitations?',
      'Help me write a compelling bio for my industry'
    ],
    idleTips: [
      '📋 Profiles with a clear photo and portfolio earn trust 4x faster!'
    ]
  },
  {
    id: 'star-badge',
    name: 'Champion Novo',
    role: 'Reputation & Ratings Ambassador',
    tagline: 'Celebrating excellence and 5-star ratings',
    image: '/mascot/star-badge.png',
    category: 'community',
    matchedRoutes: ['/app/profile'],
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    badgeText: 'Reputation',
    welcomeGreeting: 'Shine bright! Champion Novo monitors your reputation score, peer reviews, and verified achievements.',
    quickPrompts: [
      'How can I improve my client review score?',
      'How are trust ratings calculated on HubNovo?',
      'How do I showcase completed project milestones?'
    ],
    idleTips: [
      '⭐ Deliver on time, communicate clearly, and the 5 stars follow!'
    ]
  },
  {
    id: 'clock-reminder',
    name: 'Chrono Novo',
    role: 'Schedules & Milestones Timer',
    tagline: 'Staying on schedule with deadlines & deliveries',
    image: '/mascot/clock-reminder.png',
    category: 'community',
    matchedRoutes: ['/app/schedules'],
    themeColor: '#0EA5E9',
    glowColor: 'rgba(14, 165, 233, 0.45)',
    badgeText: 'Timer',
    welcomeGreeting: 'Tick-tock! Chrono Novo keeps your milestones running like clockwork so you never miss a deadline.',
    quickPrompts: [
      'How to set realistic project milestones for clients',
      'What happens if a deadline needs to be extended?',
      'How do auto-reminders help project delivery?'
    ],
    idleTips: [
      '⏰ Early notifications prevent last-minute project delays.'
    ]
  },

  // ── LEARNING & TECH ─────────────────────────────────────────────
  {
    id: 'book-learn',
    name: 'Scholar Novo',
    role: 'Learning Mentor & Academy Guide',
    tagline: 'Practical masterclasses for Nigerian entrepreneurs',
    image: '/mascot/book-learn.png',
    category: 'learning',
    matchedRoutes: ['/app/learn'],
    themeColor: '#00A86B',
    glowColor: 'rgba(0, 168, 107, 0.45)',
    badgeText: 'Academy Mentor',
    welcomeGreeting: 'Knowledge is power! Scholar Novo is your personal tutor. What skill would you like to master today?',
    quickPrompts: [
      'Recommend top free courses for Nigerian entrepreneurs',
      'How do I earn verified completion certificates?',
      'What are the best masterclasses on digital marketing?',
      'How to prepare financial statements for my business'
    ],
    idleTips: [
      '📚 Spend 15 minutes a day learning to rapidly expand your market value.',
      '🎓 HubNovo certificates can be embedded directly in your LinkedIn profile!'
    ]
  },
  {
    id: 'tablet-tech',
    name: 'Modus Novo',
    role: 'Digital Hub & Tech Architect',
    tagline: 'Empowering digital innovation and technology',
    image: '/mascot/tablet-tech.png',
    category: 'learning',
    matchedRoutes: ['/app/modushive'],
    themeColor: '#00B8D9',
    glowColor: 'rgba(0, 184, 217, 0.45)',
    badgeText: 'Tech Architect',
    welcomeGreeting: 'Systems online! Modus Novo is here to guide you through ModusHive digital tools, APIs, and dev workflows.',
    quickPrompts: [
      'What is ModusHive and how does it empower tech teams?',
      'How can I integrate HubNovo APIs with my website?',
      'What developer tools and resources are available?'
    ],
    idleTips: [
      '💻 ModusHive bridges African software builders with real-world enterprise needs.'
    ]
  },
  {
    id: 'lightbulb-idea',
    name: 'Spark Novo',
    role: 'Ideation & Creative Strategist',
    tagline: 'Igniting breakthrough business ideas & solutions',
    image: '/mascot/lightbulb-idea.png',
    category: 'learning',
    matchedRoutes: ['/app/ideas'],
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    badgeText: 'AI Spark',
    welcomeGreeting: 'Aha! Spark Novo is fully charged with creative insights, business brainstorms, and strategic ideas.',
    quickPrompts: [
      'Brainstorm 5 innovative tech solutions for Nigerian agriculture',
      'How to validate an idea before spending money building it',
      'What problems in Lagos or Kano need urgent tech solutions?'
    ],
    idleTips: [
      '💡 Great ideas start by solving an everyday frustration in your neighbourhood!'
    ]
  },
  {
    id: 'trophy-winner',
    name: 'Victor Novo',
    role: 'Milestones & Impact Hall of Fame',
    tagline: 'Celebrating victories, hackathons and awards',
    image: '/mascot/trophy-winner.png',
    category: 'learning',
    matchedRoutes: ['/app/milestones'],
    themeColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    badgeText: 'Winner Circle',
    welcomeGreeting: 'Stand on the podium! Victor Novo celebrates your achievements, hackathon prizes, and community impact.',
    quickPrompts: [
      'What are the criteria for the annual Impact Awards?',
      'How does the community leaderboard rank changemakers?',
      'How to showcase company awards on my company profile'
    ],
    idleTips: [
      '🏆 Every small community milestone brings us closer to collective prosperity.'
    ]
  },
  {
    id: 'calendar-event',
    name: 'Calendar Novo',
    role: 'Events, Webinars & Masterclasses',
    tagline: 'Connecting you to upcoming workshops & meetups',
    image: '/mascot/calendar-event.png',
    category: 'learning',
    matchedRoutes: ['/app/events'],
    themeColor: '#00A86B',
    glowColor: 'rgba(0, 168, 107, 0.45)',
    badgeText: 'Events',
    welcomeGreeting: 'Mark your calendar! Calendar Novo highlights upcoming webinars, investor demo days, and artisan workshops.',
    quickPrompts: [
      'What virtual demo days or workshops are scheduled this month?',
      'How do I host an educational webinar on HubNovo?',
      'Can I set automated reminders for grant application deadlines?'
    ],
    idleTips: [
      '📅 Attending live demo days expands your network with active angel funders.'
    ]
  },
  {
    id: 'heart-glow',
    name: 'Radiant Novo',
    role: 'Philanthropy & Goodwill Ambassador',
    tagline: 'Multiplying empathy and community donations',
    image: '/mascot/heart-glow.png',
    category: 'community',
    matchedRoutes: ['/app/impact'],
    themeColor: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    badgeText: 'Goodwill',
    welcomeGreeting: 'With warmth and heart! Radiant Novo helps you direct goodwill, donations, and volunteer power where it counts.',
    quickPrompts: [
      'How does 100% transparent donation tracking work?',
      'Show me health and educational grassroots projects needing help',
      'How do NGOs get verified on HubNovo?'
    ],
    idleTips: [
      '💚 Small acts of kindness multiplied by a community change the nation.'
    ]
  }
]

/**
 * Returns the best mascot look for the given route pathname.
 * If a custom look ID is selected by the user, returns that look.
 * Defaults to Gateway Novo if no specific match is found.
 */
export function getMascotForPathname(pathname: string, customLookId?: string | null): MascotLook {
  if (customLookId) {
    const custom = ALL_MASCOT_LOOKS.find((m) => m.id === customLookId)
    if (custom) return custom
  }

  // Exact or prefix match
  for (const look of ALL_MASCOT_LOOKS) {
    for (const route of look.matchedRoutes) {
      if (pathname === route) return look
      // Child routes like /app/funding/123 match /app/funding, but /app matches only /app
      if (route !== '/app' && pathname.startsWith(route)) {
        return look
      }
    }
  }

  // Fallback to portal guide for /app or lightbulb for landing
  if (pathname.startsWith('/app')) {
    return ALL_MASCOT_LOOKS[0] // Gateway Novo
  }
  return ALL_MASCOT_LOOKS[20] // Spark Novo
}
