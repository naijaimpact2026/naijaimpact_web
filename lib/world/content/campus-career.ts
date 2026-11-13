import { CONSENT, HONEST, NO_PII, area, file, form, link, pick, text, video, type SeedMission } from './types'

/*
 * Career & Employability pathway — Stage 1 "Discover & Define" (weeks 1–4).
 * DRAFT content from the Weeks 1–4 playbook; the curriculum lead edits it
 * in admin. Answer keys are server-only.
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
        key: 'c-w1-d1', pathway: 'career', week: 1, day: 1, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 10, xp: 50, tokens: 5,
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
        key: 'c-w1-d2', pathway: 'career', week: 1, day: 2, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 60, tokens: 5,
        title: 'Career booths: compare three careers',
        story: 'Visit three career booths in the district. For each career, note what people actually do, the skills it needs and how people get in. Then save your top three.',
        config: form([
            text('career1', 'Career 1'), area('career1_notes', 'Career 1 — daily tasks, key skills, entry route', 25),
            text('career2', 'Career 2'), area('career2_notes', 'Career 2 — daily tasks, key skills, entry route', 25),
            text('career3', 'Career 3'), area('career3_notes', 'Career 3 — daily tasks, key skills, entry route', 25),
            area('shortlist_reason', 'Your top-3 order and why', 20),
        ], { variant: 'comparison' }),
    },
    {
        key: 'c-w1-d3', pathway: 'career', week: 1, day: 3, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 60, tokens: 5,
        title: 'Three mini-job simulations',
        story: 'Try three short work tasks: reply to a customer, read a chart and plan a task. Pick the best response each time.',
        config: {
            intro: 'You are a new intern at a growing Lagos delivery company.',
            start: 'n1',
            nodes: [
                { id: 'n1', text: 'A customer writes: “My order is 2 days late and nobody is answering!” What do you reply?', choices: [
                    { id: 'n1a', label: '“Sorry for the delay. Your order is with our Ikeja hub and will arrive tomorrow by 2pm. I’ll message you when it leaves.”', next: 'n2' },
                    { id: 'n1b', label: '“Delays happen, please be patient.”', next: 'n2' },
                    { id: 'n1c', label: 'Ignore it — the driver will handle it.', next: 'n2' },
                ] },
                { id: 'n2', text: 'Your manager shows a chart: deliveries rose from 400 in March to 600 in April, but late deliveries rose from 20 to 90. What is the key insight?', choices: [
                    { id: 'n2a', label: 'Business grew 50%, but the late rate jumped from 5% to 15% — capacity isn’t keeping up.', next: 'n3' },
                    { id: 'n2b', label: 'Business is growing, so everything is fine.', next: 'n3' },
                    { id: 'n2c', label: 'Late deliveries are only 90, which is small.', next: 'n3' },
                ] },
                { id: 'n3', text: 'You must organise a team meeting for Friday. What do you do first?', choices: [
                    { id: 'n3a', label: 'Agree the goal and agenda, check everyone’s availability, then send an invite with the agenda.' },
                    { id: 'n3b', label: 'Book a room and hope people come.' },
                    { id: 'n3c', label: 'Post “meeting Friday” in the group chat.' },
                ] },
            ],
        },
        answerKey: { scores: { n1a: 100, n1b: 30, n1c: 0, n2a: 100, n2b: 10, n2c: 30, n3a: 100, n3b: 30, n3c: 20 } },
    },
    {
        key: 'c-w1-d4', pathway: 'career', week: 1, day: 4, kind: 'reflection', bucket: 'reflection', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 15, xp: 50, tokens: 5,
        title: 'Meet a mentor avatar',
        story: 'A mentor avatar is waiting in the Career District. Prepare three questions about a career you shortlisted, write what you learned, and reflect for 60 seconds.',
        config: form([
            area('questions', 'Your 3 prepared questions', 15),
            area('answers', 'What you learned from the mentor (or the Novi coach)', 30),
            area('reflection', 'Reflection: what surprised you, and what will you do next?', 30),
            video('reflection_video', 'Optional: 60-second video reflection', 60, { required: false }),
        ]),
    },
    {
        key: 'c-w1-d5', pathway: 'career', week: 1, day: 5, kind: 'team', bucket: 'teamwork', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 25, xp: 70, tokens: 7,
        title: 'Strengths Lab with your squad',
        story: 'Join your squad for the timed Strengths Lab puzzle. Afterwards, collect evidence of two strengths you showed — with an example for each.',
        config: form([
            text('squad', 'Squad name or teammates’ usernames'),
            area('strength1', 'Strength 1 + example from the challenge', 20),
            area('strength2', 'Strength 2 + example from the challenge', 20),
            area('feedback', 'One piece of constructive feedback you gave a teammate', 15),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'c-w1-d6', pathway: 'career', week: 1, day: 6, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 30, xp: 100, tokens: 10,
        title: 'Reality mission: talk to a professional',
        story: 'Ask a trusted professional about their work (in person or by call). Submit five anonymised insights — no names or contacts.',
        config: form([
            text('role', 'Their job title / industry (no name)'),
            area('insight1', 'Insight 1', 10), area('insight2', 'Insight 2', 10), area('insight3', 'Insight 3', 10),
            area('insight4', 'Insight 4', 10), area('insight5', 'Insight 5', 10),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'c-w1-d7', pathway: 'career', week: 1, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 500, tokens: 20,
        title: 'Boss challenge: Career Map',
        story: 'Present your career map: three options, your strengths, and one evidence-based choice for what to explore next.',
        badge: { key: 'career-explorer', label: 'Career Explorer' },
        config: form([
            area('options', 'Your 3 career options and what you learned about each', 60),
            area('strengths', 'Your top strengths, with evidence from this week', 40),
            area('choice', 'The one path you’ll explore next — and the evidence behind it', 40),
            video('pitch', 'Optional: 90-second video of your Career Map', 90, { required: false }),
        ], { checklist: [HONEST] }),
    },

    // ─── Week 2 — Future of work & skills ────────────────────────────────────
    {
        key: 'c-w2-d1', pathway: 'career', week: 2, day: 1, kind: 'sort', bucket: 'quality', reviewMode: 'auto', estMinutes: 10, xp: 60, tokens: 5,
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
        key: 'c-w2-d2', pathway: 'career', week: 2, day: 2, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 10, xp: 60, tokens: 5,
        title: 'AI-literacy: check the AI’s answer',
        story: 'An AI assistant wrote: “Nigeria has 50 states. To apply for a job, always share your BVN and home address in your CV. Men make better engineers.” Spot the problems.',
        config: {
            graded: true,
            questions: [
                { id: 'q1', prompt: '“Nigeria has 50 states” is…', options: [{ id: 'a', label: 'Correct' }, { id: 'b', label: 'A factual error — Nigeria has 36 states and the FCT' }, { id: 'c', label: 'An opinion' }] },
                { id: 'q2', prompt: 'Sharing your BVN and home address in a CV is…', options: [{ id: 'a', label: 'Good practice' }, { id: 'b', label: 'A privacy and fraud risk' }, { id: 'c', label: 'Required by law' }] },
                { id: 'q3', prompt: '“Men make better engineers” is an example of…', options: [{ id: 'a', label: 'A verified fact' }, { id: 'b', label: 'Bias / stereotype' }, { id: 'c', label: 'A helpful tip' }] },
                { id: 'q4', prompt: 'The best way to use an AI answer at work is to…', options: [{ id: 'a', label: 'Copy it directly' }, { id: 'b', label: 'Check facts against trusted sources and edit it' }, { id: 'c', label: 'Never use AI' }] },
                { id: 'q5', prompt: 'Which should you NEVER paste into a public AI tool?', options: [{ id: 'a', label: 'A public news article' }, { id: 'b', label: 'Customers’ personal data or passwords' }, { id: 'c', label: 'A grammar question' }] },
            ],
        },
        answerKey: { correct: { q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b' } },
    },
    {
        key: 'c-w2-d3', pathway: 'career', week: 2, day: 3, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 70, tokens: 7,
        title: 'Digital skills diagnostic',
        story: 'Rotate through the digital tools, communication and data stations. Each answer adds to your diagnostic score.',
        config: {
            graded: true,
            questions: [
                { id: 'q1', prompt: 'In a spreadsheet, which formula adds cells A1 to A10?', options: [{ id: 'a', label: '=ADD(A1:A10)' }, { id: 'b', label: '=SUM(A1:A10)' }, { id: 'c', label: '=TOTAL(A1-A10)' }] },
                { id: 'q2', prompt: 'The best subject line for a job application email is…', options: [{ id: 'a', label: '“Hi”' }, { id: 'b', label: '“Application: Junior Data Analyst — Ada Obi”' }, { id: 'c', label: '“URGENT!!!”' }] },
                { id: 'q3', prompt: 'A strong password is…', options: [{ id: 'a', label: 'Your birthday' }, { id: 'b', label: 'A long passphrase with mixed characters, unique per site' }, { id: 'c', label: '“password123”' }] },
                { id: 'q4', prompt: 'Sales were ₦200k, ₦250k and ₦300k over three months. The average is…', options: [{ id: 'a', label: '₦250k' }, { id: 'b', label: '₦750k' }, { id: 'c', label: '₦300k' }] },
                { id: 'q5', prompt: 'You get an email asking you to “verify your bank login” via a link. You should…', options: [{ id: 'a', label: 'Click and log in quickly' }, { id: 'b', label: 'Treat it as phishing and contact the bank directly' }, { id: 'c', label: 'Forward it to friends' }] },
                { id: 'q6', prompt: 'To share a large file with a team, the best option is…', options: [{ id: 'a', label: 'A shared cloud folder link with the right permissions' }, { id: 'b', label: 'Printing it' }, { id: 'c', label: 'Splitting it across 20 WhatsApp messages' }] },
                { id: 'q7', prompt: 'Which chart best shows change over time?', options: [{ id: 'a', label: 'Pie chart' }, { id: 'b', label: 'Line chart' }, { id: 'c', label: 'Word cloud' }] },
                { id: 'q8', prompt: 'In a video meeting you should…', options: [{ id: 'a', label: 'Mute when not speaking and use the chat for links' }, { id: 'b', label: 'Keep your mic open in a noisy place' }, { id: 'c', label: 'Join late without notice' }] },
            ],
        },
        answerKey: { correct: { q1: 'b', q2: 'b', q3: 'b', q4: 'a', q5: 'b', q6: 'a', q7: 'b', q8: 'a' } },
    },
    {
        key: 'c-w2-d4', pathway: 'career', week: 2, day: 4, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 70, tokens: 7,
        title: 'Job description detective',
        story: 'Study five real job descriptions for roles you’re interested in (Hubnovo Jobs or partner listings). Tally the skills that keep coming up.',
        config: form([
            area('roles', 'The 5 roles you studied (title + industry)', 15),
            area('common_skills', 'Skills that appear in 3 or more listings', 15),
            area('my_match', 'Which of these you already have — with evidence', 20),
            area('gaps', 'Your top 3 skill gaps', 10),
        ]),
    },
    {
        key: 'c-w2-d5', pathway: 'career', week: 2, day: 5, kind: 'team', bucket: 'teamwork', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Team challenge: workplace brief',
        story: 'Your squad gets a client brief: “Plan a one-day youth career fair for 200 students with a ₦300,000 budget.” Deliver a plan by the deadline and peer-review another squad.',
        config: form([
            text('squad', 'Squad name'),
            area('plan', 'Your plan: agenda, budget breakdown, roles', 60),
            area('my_role', 'What you personally contributed', 20),
            area('peer_review', 'Your feedback on another squad’s plan (kind + specific)', 20),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'c-w2-d6', pathway: 'career', week: 2, day: 6, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 100, tokens: 10,
        title: 'Beginner skill task + portfolio artifact',
        story: 'Spend 30 minutes on a beginner task in a skill you want (a spreadsheet budget, a poster, a short article, a simple web page…). Publish it as a portfolio artifact.',
        config: form([
            text('skill', 'The skill you practised'),
            link('artifact_link', 'Link to your artifact', { required: false }),
            file('artifact_file', 'Or upload it', ['image', 'pdf'], { required: false }),
            area('what_i_did', 'What you made, how, and what you learned', 30),
            pick('accessibility', 'Accessibility check: did you add alt text / readable fonts / captions where needed?', ['Yes', 'Partly', 'Not applicable']),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'c-w2-d7', pathway: 'career', week: 2, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 750, tokens: 30,
        title: 'Boss challenge: Skills Arena',
        story: 'Demonstrate one new skill you practised this week and publish your top three skill gaps with a plan to close them.',
        badge: { key: 'future-skills', label: 'Future Skills' },
        config: form([
            area('demo', 'Describe the skill and what you can now do', 40),
            link('demo_link', 'Link to your demonstration (artifact, video, document)', { required: false }),
            video('demo_video', 'Optional: 2-minute video demonstration', 120, { required: false }),
            area('gaps_plan', 'Your top 3 skill gaps and a learning plan for each', 50),
        ], { checklist: [HONEST] }),
    },

    // ─── Week 3 — Goals & personal brand ─────────────────────────────────────
    {
        key: 'c-w3-d1', pathway: 'career', week: 3, day: 1, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 15, xp: 70, tokens: 7,
        title: 'Goal Forge: your 90-day goal',
        story: 'Forge one SMART 90-day career goal and three measurable weekly milestones.',
        config: form([
            area('goal', 'Your 90-day goal (Specific, Measurable, Achievable, Relevant, Time-bound)', 15),
            text('m1', 'Milestone 1 (measurable)'), text('m2', 'Milestone 2 (measurable)'), text('m3', 'Milestone 3 (measurable)'),
            area('why', 'Why this goal matters to you', 15),
        ], { variant: 'goal_forge' }),
    },
    {
        key: 'c-w3-d2', pathway: 'career', week: 3, day: 2, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 70, tokens: 7,
        title: 'Personal Branding Lab',
        story: 'Draft a truthful professional bio, skill tags and a portfolio headline. Ask the Novi coach for suggestions — then decide what to keep.',
        config: form([
            text('headline', 'Portfolio headline (one line)'),
            area('bio', 'Professional bio (80–150 words, honest)', 60, { maxWords: 180 }),
            text('skills', 'Skill tags (comma-separated)'),
            area('ai_changes', 'Which AI suggestions did you accept or reject — and why?', 15),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'c-w3-d3', pathway: 'career', week: 3, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 100, tokens: 10,
        title: 'One-page CV from real experience',
        story: 'Build a one-page CV using only real, verifiable experience — school projects, volunteering, side gigs all count. No inflated claims.',
        config: form([
            area('cv_text', 'Paste your CV text (summary, education, experience, skills)', 120, { maxWords: 900 }),
            file('cv_file', 'Upload your CV (PDF)', ['pdf'], { required: false }),
            area('evidence', 'For two CV claims, what evidence backs them up?', 20),
        ], { checklist: [HONEST, NO_PII] }),
    },
    {
        key: 'c-w3-d4', pathway: 'career', week: 3, day: 4, kind: 'video', bucket: 'evidence', reviewMode: 'auto', estMinutes: 15, xp: 70, tokens: 7,
        title: 'Networking room: 45-second introduction',
        story: 'Record a 45-second professional introduction: who you are, what you’re building towards, and what help you’re looking for.',
        config: form([
            video('intro', 'Your 45-second introduction', 60),
            area('script', 'Your script or key points', 30),
        ]),
    },
    {
        key: 'c-w3-d5', pathway: 'career', week: 3, day: 5, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 30, xp: 90, tokens: 9,
        title: 'Two-item portfolio with captions',
        story: 'Put two of your best pieces of work in a mini portfolio. Caption each: the problem, what you did, the result.',
        config: form([
            link('item1', 'Item 1 link', { required: true }), area('item1_caption', 'Item 1 caption', 25),
            link('item2', 'Item 2 link', { required: true }), area('item2_caption', 'Item 2 caption', 25),
            pick('privacy', 'Privacy check: is everything safe to share publicly?', ['Yes, nothing private', 'I removed private details']),
        ], { checklist: [HONEST, NO_PII] }),
    },
    {
        key: 'c-w3-d6', pathway: 'career', week: 3, day: 6, kind: 'reflection', bucket: 'reflection', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Real-world mission: mentor CV review',
        story: 'Ask a trusted mentor, lecturer or professional to review your CV or portfolio. Record three changes you made because of their feedback.',
        config: form([
            text('reviewer', 'Their role (no name)'),
            area('change1', 'Change 1 — what they said and what you changed', 15),
            area('change2', 'Change 2', 15),
            area('change3', 'Change 3', 15),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'c-w3-d7', pathway: 'career', week: 3, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 1000, tokens: 40,
        title: 'Boss challenge: Brand Studio',
        story: 'Deliver your professional brand: bio, CV, portfolio link and your 90-day goal.',
        badge: { key: 'brand-builder', label: 'Brand Builder' },
        config: form([
            area('bio', 'Final bio', 60, { maxWords: 200 }),
            file('cv', 'Final CV (PDF)', ['pdf'], { required: true }),
            link('portfolio', 'Portfolio link', { required: true }),
            area('goal', 'Your 90-day goal and first milestone progress', 30),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 4 — Define, pitch & progress ───────────────────────────────────
    {
        key: 'c-w4-d1', pathway: 'career', week: 4, day: 1, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 15, xp: 70, tokens: 7,
        title: 'Career Route Planner',
        story: 'Enter the Career Route Planner. Choose your target role and three skill-building actions that move you towards it.',
        config: form([
            text('target_role', 'Target role'),
            area('action1', 'Action 1 (what, by when, how you’ll measure it)', 12),
            area('action2', 'Action 2', 12),
            area('action3', 'Action 3', 12),
        ], { variant: 'route_planner' }),
    },
    {
        key: 'c-w4-d2', pathway: 'career', week: 4, day: 2, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 70, tokens: 7,
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
        key: 'c-w4-d3', pathway: 'career', week: 4, day: 3, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 25, xp: 80, tokens: 8,
        title: 'Mock interview — round 1',
        story: 'Answer three common interview questions in writing. You’ll get rubric feedback on examples, clarity and preparation.',
        config: form([
            area('q1', '“Tell me about yourself.”', 50),
            area('q2', '“Describe a time you solved a difficult problem.”', 50),
            area('q3', '“Why do you want this role?”', 40),
        ], { variant: 'mock_interview' }),
    },
    {
        key: 'c-w4-d4', pathway: 'career', week: 4, day: 4, kind: 'reflection', bucket: 'reflection', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 25, xp: 80, tokens: 8,
        title: 'Mock interview — round 2 (STAR)',
        story: 'Improve one answer using STAR: Situation, Task, Action, Result. Then explain what you changed after round-1 feedback.',
        config: form([
            area('situation', 'Situation', 10), area('task', 'Task', 10), area('action', 'Action', 20), area('result', 'Result (with numbers if possible)', 10),
            area('improvement', 'What you improved since round 1', 20),
        ], { variant: 'star' }),
    },
    {
        key: 'c-w4-d5', pathway: 'career', week: 4, day: 5, kind: 'live_event', bucket: 'teamwork', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 45, xp: 80, tokens: 8,
        title: 'Team career fair',
        story: 'Join the moderated virtual career fair with your squad. Practise professional introductions and explore verified opportunities.',
        config: form([
            area('met', 'Organisations or people you met (no personal contacts)', 15),
            area('learned', 'Two things you learned', 20),
            area('next_step', 'One verified opportunity you’ll follow up on', 10),
        ], { checklist: [NO_PII] }),
    },
    {
        key: 'c-w4-d6', pathway: 'career', week: 4, day: 6, kind: 'video', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 100, tokens: 10,
        title: 'Career pitch + 30/60/90-day plan',
        story: 'Record a 2-minute career pitch: “My career path and impact”. Then finalise your 30/60/90-day action plan.',
        config: form([
            video('pitch', '2-minute career pitch', 120),
            area('plan30', 'First 30 days', 20), area('plan60', 'Days 31–60', 20), area('plan90', 'Days 61–90', 20),
        ]),
    },
    {
        key: 'c-w4-d7', pathway: 'career', week: 4, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'showcase', estMinutes: 40, xp: 1500, tokens: 60,
        title: 'Career Showcase (Stage 1 finale)',
        story: 'Submit your Stage 1 evidence bundle: pitch, CV, portfolio and plan. Judges score it and you receive your readiness score for Stage 2.',
        badge: { key: 'career-stage1', label: 'Career Stage 1 Complete' },
        config: form([
            link('portfolio', 'Portfolio link', { required: true }),
            file('cv', 'Final CV (PDF)', ['pdf'], { required: true }),
            video('pitch', 'Final 2-minute pitch', 120),
            area('journey', 'Your Stage 1 journey: what changed, with evidence', 80),
            area('next', 'What you’ll focus on in Stage 2', 30),
        ], { checklist: [HONEST, NO_PII] }),
    },
]

