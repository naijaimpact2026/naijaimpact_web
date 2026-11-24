import { CONSENT, HONEST, NO_PII, area, file, form, line, link, video, type SeedMission } from './types'

/*
 * Career & Employability pathway — Stage 1 "Discover & Define" (weeks 1–4).
 * Three quests a week (24 Nov 2026): Play on Monday (a game in the Learning
 * Academy), Do on Wednesday (one real-world task: an upload + one line) and
 * Show on Sunday (the judged showcase in the Arena). Answer keys are
 * server-only; the curriculum lead edits all of this in admin.
 */

const CLUSTERS = [
    { id: 'tech', label: 'Tech & digital' },
    { id: 'creative', label: 'Creative & media' },
    { id: 'business', label: 'Business & finance' },
    { id: 'public', label: 'Public service & policy' },
    { id: 'green', label: 'Green & agriculture' },
    { id: 'social', label: 'Health, education & social' },
]
const opts = (labels: string[]) => labels.map((label, i) => ({ id: CLUSTERS[i].id, label }))

export const CAREER_STAGE1: SeedMission[] = [
    // ─── Week 1 — Know yourself & explore ────────────────────────────────────
    {
        key: 'c-w1-d1', pathway: 'career', week: 1, day: 1, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 10, xp: 100, tokens: 10,
        title: 'Skill Compass: strengths, interests & values',
        story: 'Welcome to the Career District! Before you explore, the Skill Compass needs to know what drives you. There are no right or wrong answers — answer honestly.',
        config: {
            graded: false,
            questions: [
                { id: 'q1', prompt: 'On a free Saturday, which would you most enjoy?', options: opts(['Building or fixing something on a computer', 'Designing, writing or filming something', 'Selling or organising a small event', 'Volunteering for a community cause', 'Gardening or a clean-up project', 'Teaching or caring for someone']) },
                { id: 'q2', prompt: 'Which school subject felt most natural?', options: opts(['Maths / computing', 'Art / literature', 'Commerce / economics', 'Government / civic education', 'Agric / geography', 'Biology / health science']) },
                { id: 'q3', prompt: 'Friends usually come to you for…', options: opts(['Tech help', 'Creative ideas', 'Money or business advice', 'Fair decisions and rules', 'Practical, outdoor know-how', 'Listening and support']) },
                { id: 'q4', prompt: 'Which problem would you most like to solve?', options: opts(['Slow, broken digital services', 'Stories that never get told', 'Small businesses that fail', 'Weak public services', 'Climate and food insecurity', 'Poor access to health or schools']) },
                { id: 'q5', prompt: 'Your ideal workday is mostly…', options: opts(['Solving technical puzzles', 'Making and presenting things', 'Negotiating and planning', 'Serving the public', 'Working outdoors or with nature', 'Helping people one-on-one']) },
                { id: 'q6', prompt: 'Which value matters most to you at work?', options: opts(['Innovation', 'Self-expression', 'Financial growth', 'Justice and fairness', 'Sustainability', 'Compassion']) },
                { id: 'q7', prompt: 'Which tool would you pick up first?', options: opts(['A laptop', 'A camera or sketchbook', 'A spreadsheet', 'A policy report', 'A soil test kit', 'A first-aid kit']) },
                { id: 'q8', prompt: 'You learn best by…', options: opts(['Trying and debugging', 'Creating examples', 'Case studies of real businesses', 'Debates and discussions', 'Field visits', 'Helping and observing people']) },
                { id: 'q9', prompt: 'Which achievement would make you proudest?', options: opts(['Launching an app', 'A viral campaign or film', 'Hiring my first staff', 'A law or programme that helps millions', 'A thriving farm or green project', 'Students or patients who thrive']) },
                { id: 'q10', prompt: 'In a group project you usually…', options: opts(['Handle the technical parts', 'Make it look and sound good', 'Keep budget and timeline', 'Make sure everyone is treated fairly', 'Handle logistics and materials', 'Keep the team motivated']) },
                { id: 'q11', prompt: 'Which news headline would you click first?', options: opts(['“New AI tool launched”', '“Nollywood breaks record”', '“Startup raises funding”', '“New youth policy announced”', '“Farmers adopt solar irrigation”', '“Free clinic opens in town”']) },
                { id: 'q12', prompt: 'Which sounds most like you?', options: opts(['Curious and logical', 'Imaginative and expressive', 'Ambitious and practical', 'Principled and responsible', 'Hands-on and patient', 'Caring and people-focused']) },
            ],
        },
    },
    {
        key: 'c-w1-d6', pathway: 'career', week: 1, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 20, xp: 200, tokens: 20,
        title: 'Talk to a professional',
        story: 'Find someone who does a job you’re curious about and ask them about their work, in person or by call. Snap a photo of your notes, then tell us the most surprising thing you learned.',
        config: form([
            file('notes', 'A photo of your notes (or a PDF)', ['image', 'pdf'], { required: true }),
            line('surprise', 'The most surprising thing they told you'),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'c-w1-d7', pathway: 'career', week: 1, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 500, tokens: 20,
        title: 'Boss challenge: Career Map',
        story: 'Show your career map: the careers you explored this week and the one you’ll explore next.',
        badge: { key: 'career-explorer', label: 'Career Explorer' },
        config: form([
            file('map', 'Your career map: a photo, drawing or slide', ['image', 'pdf'], { required: true }),
            area('choice', 'The one path you’ll explore next, and why', 20, { maxWords: 150 }),
            video('pitch', 'Optional: a 60-second video of your map', 60, { required: false }),
        ], { checklist: [HONEST] }),
    },

    // ─── Week 2 — Future of work & skills ────────────────────────────────────
    {
        key: 'c-w2-d1', pathway: 'career', week: 2, day: 1, kind: 'sort', bucket: 'quality', reviewMode: 'auto', estMinutes: 10, xp: 100, tokens: 10,
        title: 'Future-of-Work Dome: changing vs durable',
        story: 'Sort each work task: is it likely to change a lot with automation and AI, or is it a durable human skill that stays valuable?',
        config: {
            prompt: 'Drag each item into the right group.',
            bins: [{ id: 'changing', label: 'Changing fast with AI/automation' }, { id: 'durable', label: 'Durable human skill' }],
            items: [
                { id: 'i1', label: 'Typing up handwritten forms' }, { id: 'i2', label: 'Calming an upset customer' },
                { id: 'i3', label: 'Basic bookkeeping entries' }, { id: 'i4', label: 'Leading a team through change' },
                { id: 'i5', label: 'Translating simple documents' }, { id: 'i6', label: 'Negotiating a fair deal' },
                { id: 'i7', label: 'Scheduling routine appointments' }, { id: 'i8', label: 'Creative problem solving' },
                { id: 'i9', label: 'Sorting emails into folders' }, { id: 'i10', label: 'Ethical judgement' },
                { id: 'i11', label: 'Writing first-draft product descriptions' }, { id: 'i12', label: 'Mentoring a new colleague' },
            ],
        },
        answerKey: { correct: { i1: 'changing', i2: 'durable', i3: 'changing', i4: 'durable', i5: 'changing', i6: 'durable', i7: 'changing', i8: 'durable', i9: 'changing', i10: 'durable', i11: 'changing', i12: 'durable' } },
    },
    {
        key: 'c-w2-d6', pathway: 'career', week: 2, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 35, xp: 200, tokens: 20,
        title: 'Make something in 30 minutes',
        story: 'Pick a skill you want (a spreadsheet budget, a poster, a short article, a simple web page…) and make one small thing in 30 minutes.',
        config: form([
            file('artifact', 'Upload what you made (screenshot, photo or PDF)', ['image', 'pdf'], { required: true }),
            line('learned', 'What you learned making it'),
            link('artifact_link', 'Optional: a link to it', { required: false }),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'c-w2-d7', pathway: 'career', week: 2, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 750, tokens: 30,
        title: 'Boss challenge: Skills Arena',
        story: 'Show one new skill you practised this week and your plan for the skills you still need.',
        badge: { key: 'future-skills', label: 'Future Skills' },
        config: form([
            file('demo', 'Proof of your new skill (screenshot, photo or PDF)', ['image', 'pdf'], { required: true }),
            area('gaps', 'Your top 3 skill gaps and one action for each', 20, { maxWords: 150 }),
            video('demo_video', 'Optional: a 60-second demo video', 60, { required: false }),
        ], { checklist: [HONEST] }),
    },

    // ─── Week 3 — Goals & personal brand ─────────────────────────────────────
    {
        key: 'c-w3-play', pathway: 'career', week: 3, day: 1, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 8, xp: 100, tokens: 10,
        title: 'CV Clinic: spot the strong CV',
        story: 'The CV Clinic is busy today. Help the recruiter spot what makes a CV stand out, and what gets it thrown away.',
        config: {
            graded: true,
            questions: [
                { id: 'q1', prompt: 'Which CV line is strongest?', options: [{ id: 'a', label: 'Hardworking team player with good skills' }, { id: 'b', label: 'Led a 5-person class project that raised ₦120,000 for a school library' }, { id: 'c', label: 'I am a very passionate person' }] },
                { id: 'q2', prompt: 'What should you leave OFF your CV?', options: [{ id: 'a', label: 'A short skills list' }, { id: 'b', label: 'Volunteering you did' }, { id: 'c', label: 'Your BVN, home address and religion' }] },
                { id: 'q3', prompt: 'For an entry-level role, your CV should usually be…', options: [{ id: 'a', label: 'One page with clear headings' }, { id: 'b', label: 'Five pages with every certificate' }, { id: 'c', label: 'A paragraph in an email' }] },
                { id: 'q4', prompt: 'Which email address looks most professional?', options: [{ id: 'a', label: 'sweetbabe2004@…' }, { id: 'b', label: 'kingofvibes@…' }, { id: 'c', label: 'ada.obi@…' }] },
                { id: 'q5', prompt: 'You helped run a church or mosque event. On your CV it is…', options: [{ id: 'a', label: 'Not worth adding' }, { id: 'b', label: 'Real experience: say what you did and the result' }, { id: 'c', label: 'Something to turn into a fake job title' }] },
                { id: 'q6', prompt: 'Before you send a CV you should…', options: [{ id: 'a', label: 'Proofread it and tailor it to the job' }, { id: 'b', label: 'Send the same one everywhere without reading it' }, { id: 'c', label: 'Add a made-up reference to look serious' }] },
            ],
        },
        answerKey: { correct: { q1: 'b', q2: 'c', q3: 'a', q4: 'c', q5: 'b', q6: 'a' } },
    },
    {
        key: 'c-w3-d3', pathway: 'career', week: 3, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 200, tokens: 20,
        title: 'Your one-page CV',
        story: 'Build a one-page CV from real experience: school projects, volunteering and side gigs all count. No inflated claims.',
        config: form([
            file('cv', 'Your one-page CV (PDF)', ['pdf'], { required: true }),
            line('proud', 'The CV line you’re proudest of, and what proves it'),
        ], { checklist: [HONEST, NO_PII] }),
    },
    {
        key: 'c-w3-d7', pathway: 'career', week: 3, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 1000, tokens: 40,
        title: 'Boss challenge: Brand Studio',
        story: 'Show your professional brand: a short bio, your portfolio and a 45-second introduction.',
        badge: { key: 'brand-builder', label: 'Brand Builder' },
        config: form([
            area('bio', 'Your professional bio (honest, 40–150 words)', 40, { maxWords: 150 }),
            link('portfolio', 'Your portfolio or LinkedIn link', { required: true }),
            video('intro', 'Optional: your 45-second introduction', 60, { required: false }),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 4 — Define, pitch & progress ───────────────────────────────────
    {
        key: 'c-w4-d2', pathway: 'career', week: 4, day: 1, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 100, tokens: 10,
        title: 'Workplace dilemmas',
        story: 'In a virtual informational interview, the manager asks how you would handle three real workplace dilemmas.',
        config: {
            intro: 'Choose the most professional response.',
            start: 'd1',
            nodes: [
                { id: 'd1', text: 'A colleague asks you to sign the attendance sheet for them while they run an errand.', choices: [
                    { id: 'd1a', label: 'Politely refuse and suggest they tell the supervisor.', next: 'd2' },
                    { id: 'd1b', label: 'Sign it — they’d do the same for you.', next: 'd2' },
                    { id: 'd1c', label: 'Report them immediately without talking to them.', next: 'd2' },
                ] },
                { id: 'd2', text: 'You realise you’ll miss a deadline you agreed to.', choices: [
                    { id: 'd2a', label: 'Tell your manager early, explain why, and propose a new date.', next: 'd3' },
                    { id: 'd2b', label: 'Say nothing and submit late.', next: 'd3' },
                    { id: 'd2c', label: 'Submit something unfinished on time without saying so.', next: 'd3' },
                ] },
                { id: 'd3', text: 'In a meeting, a teammate presents your idea as theirs.', choices: [
                    { id: 'd3a', label: 'Calmly add detail that shows your work, then discuss it privately afterwards.' },
                    { id: 'd3b', label: 'Accuse them loudly in the meeting.' },
                    { id: 'd3c', label: 'Stay quiet and stop sharing ideas.' },
                ] },
            ],
        },
        answerKey: { scores: { d1a: 100, d1b: 0, d1c: 40, d2a: 100, d2b: 10, d2c: 20, d3a: 100, d3b: 20, d3c: 30 } },
    },
    {
        key: 'c-w4-d6', pathway: 'career', week: 4, day: 3, kind: 'video', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 30, xp: 200, tokens: 20,
        title: 'Your 2-minute career pitch',
        story: 'Record a 2-minute pitch: who you are, the path you’ve chosen and the impact you want to make.',
        config: form([
            video('pitch', 'Your 2-minute career pitch', 120),
            line('first_step', 'Your first step in the next 30 days'),
        ]),
    },
    {
        key: 'c-w4-d7', pathway: 'career', week: 4, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'showcase', estMinutes: 30, xp: 1500, tokens: 60,
        title: 'Career Showcase (Stage 1 finale)',
        story: 'Your Stage 1 showcase: bring your CV, your portfolio and the story of your four weeks. Judges score it, and your certificate unlocks when you pass.',
        badge: { key: 'career-stage1', label: 'Career Stage 1 Complete' },
        config: form([
            file('cv', 'Final CV (PDF)', ['pdf'], { required: true }),
            link('portfolio', 'Portfolio link', { required: true }),
            area('journey', 'Your Stage 1 journey: what changed, with one example', 30, { maxWords: 200 }),
        ], { checklist: [HONEST, NO_PII] }),
    },
]
