import { Briefcase, Cpu, Sprout, Palette, HeartPulse, Sparkles, type LucideIcon } from 'lucide-react'

export interface CommunityTopic {
    id: string
    label: string
    tag: string
    emoji: string
    icon: LucideIcon
    tint: string
    badge: string
    description: string
}

export const COMMUNITY_TOPICS: CommunityTopic[] = [
    {
        id: 'entrepreneurs',
        label: 'Entrepreneurs',
        tag: 'entrepreneur',
        emoji: '💼',
        icon: Briefcase,
        tint: 'bg-primary/10 text-primary border-primary/20',
        badge: 'Business & Ventures',
        description: 'Startups, MSMEs, funding opportunities, business growth strategies, and trade networks across Nigeria.',
    },
    {
        id: 'tech',
        label: 'Tech & Innovation',
        tag: 'tech',
        emoji: '💡',
        icon: Cpu,
        tint: 'bg-cyan/10 text-cyan border-cyan/20',
        badge: 'Digital & Software',
        description: 'Software development, AI, product design, fintech, digital solutions, and tech ecosystem events.',
    },
    {
        id: 'agriculture',
        label: 'Agriculture',
        tag: 'agriculture',
        emoji: '🌾',
        icon: Sprout,
        tint: 'bg-emerald/10 text-emerald border-emerald/20',
        badge: 'Agribusiness',
        description: 'Modern farming techniques, livestock, produce distribution, agro-processing, and market prices.',
    },
    {
        id: 'creative',
        label: 'Creative Hub',
        tag: 'creative',
        emoji: '🎨',
        icon: Palette,
        tint: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        badge: 'Art & Media',
        description: 'Graphic design, film, music, fashion, photography, creative writing, and digital media production.',
    },
    {
        id: 'health',
        label: 'Health & Wellness',
        tag: 'health',
        emoji: '🌱',
        icon: HeartPulse,
        tint: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        badge: 'Wellness & Care',
        description: 'Physical fitness, mental health advocacy, healthcare best practices, wellness tips, and nutrition.',
    },
    {
        id: 'faith',
        label: 'Faith & Purpose',
        tag: 'faith',
        emoji: '✨',
        icon: Sparkles,
        tint: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        badge: 'Values & Impact',
        description: 'Inspirational reflections, ethical leadership, civic impact, and purposeful community building.',
    },
]
