import type { QuizProfile } from '../types'

/*
 * Result profiles for self-assessment quizzes (keyed by mission key). Each
 * option id in the quiz maps to one profile entry; the player's answers
 * are tallied into a ranked "compass". Client-safe.
 */
export const QUIZ_PROFILES: Record<string, QuizProfile> = {
    'c-w1-d1': {
        title: 'Your Skill Compass',
        intro: 'Here’s where your answers point. Use your top areas to pick the careers you explore this week.',
        outcomes: {
            tech: { label: 'Tech & digital', description: 'You enjoy solving problems with logic, systems and tools.', careers: ['Software developer', 'Data analyst', 'IT support specialist', 'Cybersecurity analyst'] },
            creative: { label: 'Creative & media', description: 'You like making things people see, read and feel.', careers: ['Graphic designer', 'Content creator', 'Copywriter', 'Video editor'] },
            business: { label: 'Business & finance', description: 'You’re drawn to growth, money, deals and running things well.', careers: ['Sales executive', 'Accountant', 'Entrepreneur', 'Operations manager'] },
            public: { label: 'Public service & policy', description: 'You care about fairness, rules and serving the public.', careers: ['Policy analyst', 'Civil servant', 'NGO programme officer', 'Lawyer'] },
            green: { label: 'Green & agriculture', description: 'You like practical, hands-on work with nature and the environment.', careers: ['Agritech field officer', 'Agronomist', 'Solar installer', 'Environmental officer'] },
            social: { label: 'Health, education & social', description: 'You want to help, teach and care for people.', careers: ['Nurse', 'Teacher', 'Counsellor', 'Community health worker'] },
        },
    },
}
