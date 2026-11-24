import { CONSENT, HONEST, NO_PII, area, file, form, line, video, type SeedMission } from './types'

/*
 * Enterprise Development pathway — Stage 1 "Identify & Innovate" (weeks 1–4).
 * Three quests a week (24 Nov 2026): Play on Monday (a game in the Learning
 * Academy), Do on Wednesday (one real-world task: an upload + one line) and
 * Show on Sunday (the judged showcase in the Arena). Simulations are
 * labelled as practice and never count as real validation.
 */

export const ENTERPRISE_STAGE1: SeedMission[] = [
    // ─── Week 1 — Spot problems & opportunities ──────────────────────────────
    {
        key: 'e-w1-play', pathway: 'enterprise', week: 1, day: 1, kind: 'sort', bucket: 'quality', reviewMode: 'auto', estMinutes: 8, xp: 100, tokens: 10,
        title: 'Problem Hunt: real problem or just an idea?',
        story: 'Great businesses start with a real problem, not a cool idea. Sort what you hear around the Enterprise Hub.',
        config: {
            prompt: 'Drag each one into the right group.',
            bins: [{ id: 'problem', label: 'A real problem (who + what hurts)' }, { id: 'idea', label: 'An idea looking for a problem' }],
            items: [
                { id: 'i1', label: 'Market traders lose stock every week as tomatoes spoil in the heat' },
                { id: 'i2', label: 'Build an app that uses AI and blockchain' },
                { id: 'i3', label: 'Students queue two hours to print assignments before deadlines' },
                { id: 'i4', label: 'Start a drone company because drones are cool' },
                { id: 'i5', label: 'Mothers travel 40 minutes to buy baby formula' },
                { id: 'i6', label: 'Make a social network, but better' },
                { id: 'i7', label: 'Small shops lose sales because they only take cash' },
                { id: 'i8', label: 'Sell smart watches since everyone likes gadgets' },
                { id: 'i9', label: 'Okada riders waste hours when the filling station runs dry' },
                { id: 'i10', label: 'Launch an NFT collection for my street' },
            ],
        },
        answerKey: { correct: { i1: 'problem', i2: 'idea', i3: 'problem', i4: 'idea', i5: 'problem', i6: 'idea', i7: 'problem', i8: 'idea', i9: 'problem', i10: 'idea' } },
    },
    {
        key: 'e-w1-d6', pathway: 'enterprise', week: 1, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 30, xp: 200, tokens: 20,
        title: 'Spot a real problem',
        story: 'Go and watch a busy place for 20 minutes: a queue, a market, a bus park. Snap a photo of a problem people face there (no faces) and tell us who it affects.',
        config: form([
            file('photo', 'A photo of the problem (no faces) or your notes', ['image', 'pdf'], { required: true }),
            line('who', 'The problem in one line: who it affects and how often'),
        ], { checklist: [NO_PII] }),
    },
    {
        key: 'e-w1-d7', pathway: 'enterprise', week: 1, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 500, tokens: 20,
        title: 'Boss challenge: Problem Hunter',
        story: 'Pitch one problem and prove it matters, in 90 seconds.',
        badge: { key: 'problem-solver', label: 'Problem Solver' },
        config: form([
            video('pitch', '90-second pitch video', 90),
            area('problem', 'The problem: who has it, what happens, how often', 20, { maxWords: 120 }),
            file('proof', 'Optional: your proof it matters (photo, notes or survey summary)', ['image', 'pdf'], { required: false }),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 2 — Research & understand the market ───────────────────────────
    {
        key: 'e-w2-d5', pathway: 'enterprise', week: 2, day: 1, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 100, tokens: 10,
        title: 'Price & value test (practice)',
        story: 'Practice simulation: you’re selling a ₦1,500 lunch pack near a campus. Simulated buyers react to your choices. (This is practice — it doesn’t count as real validation.)',
        config: {
            intro: 'Simulated buyers — practice only.',
            start: 'p1',
            nodes: [
                { id: 'p1', text: 'Students say ₦1,500 is too expensive, but they love the taste. What do you test next?', choices: [
                    { id: 'p1a', label: 'Test a smaller ₦1,000 pack and a ₦1,500 pack with a drink, and track which sells.', next: 'p2' },
                    { id: 'p1b', label: 'Drop the price to ₦500 for everyone.', next: 'p2' },
                    { id: 'p1c', label: 'Ignore it — they’ll pay eventually.', next: 'p2' },
                ] },
                { id: 'p2', text: 'Your ingredients cost ₦900 per pack. Which price keeps a healthy margin?', choices: [
                    { id: 'p2a', label: '₦1,300–₦1,500, with a value bundle', next: 'p3' },
                    { id: 'p2b', label: '₦950', next: 'p3' },
                    { id: 'p2c', label: '₦800 to win customers', next: 'p3' },
                ] },
                { id: 'p3', text: 'A buyer says “I’d definitely buy this” but never orders. How do you treat this feedback?', choices: [
                    { id: 'p3a', label: 'As weak evidence — real orders or pre-payments are stronger proof.' },
                    { id: 'p3b', label: 'As proof of demand.' },
                    { id: 'p3c', label: 'As a guaranteed sale.' },
                ] },
            ],
        },
        answerKey: { scores: { p1a: 100, p1b: 20, p1c: 0, p2a: 100, p2b: 30, p2c: 0, p3a: 100, p3b: 20, p3c: 0 } },
    },
    {
        key: 'e-w2-d3', pathway: 'enterprise', week: 2, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 45, xp: 200, tokens: 20,
        title: 'Talk to three customers',
        story: 'Talk to three people who might buy from you. Ask about the problem, not your idea. Photograph your notes (no names).',
        config: form([
            file('notes', 'A photo or PDF of your interview notes', ['image', 'pdf'], { required: true }),
            line('heard', 'The need you heard more than once'),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w2-d7', pathway: 'enterprise', week: 2, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 750, tokens: 30,
        title: 'Boss challenge: Market Evidence',
        story: 'Show who your customer is, what they use today, and the evidence that they want something better.',
        badge: { key: 'market-researcher', label: 'Market Researcher' },
        config: form([
            area('segment', 'Your customer: who they are and what they use today', 20, { maxWords: 150 }),
            area('evidence', 'Three pieces of evidence that people want this', 20, { maxWords: 200 }),
            video('pitch', 'Optional: a 60-second presentation', 60, { required: false }),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 3 — Ideate, build & validate ───────────────────────────────────
    {
        key: 'e-w3-play', pathway: 'enterprise', week: 3, day: 1, kind: 'quiz', bucket: 'quality', reviewMode: 'auto', estMinutes: 8, xp: 100, tokens: 10,
        title: 'Prototype Lab: test like a founder',
        story: 'Before you build, learn how founders test ideas cheaply. Six quick calls in the Prototype Lab.',
        config: {
            graded: true,
            questions: [
                { id: 'q1', prompt: 'What is a first prototype for?', options: [{ id: 'a', label: 'To be the finished product' }, { id: 'b', label: 'To learn quickly and cheaply what users need' }, { id: 'c', label: 'To impress investors only' }] },
                { id: 'q2', prompt: 'The cheapest first test of a food-delivery idea is…', options: [{ id: 'a', label: 'A custom app' }, { id: 'b', label: 'A delivery van' }, { id: 'c', label: 'A WhatsApp group and a price list' }] },
                { id: 'q3', prompt: 'In a user test, the strongest evidence is…', options: [{ id: 'a', label: 'What users actually do' }, { id: 'b', label: 'What they say they might do' }, { id: 'c', label: 'Your own opinion' }] },
                { id: 'q4', prompt: 'A tester gets stuck on your sign-up page. You…', options: [{ id: 'a', label: 'Tell them what to click and move on' }, { id: 'b', label: 'Note where they got stuck and fix it before the next test' }, { id: 'c', label: 'Blame the tester' }] },
                { id: 'q5', prompt: 'How many people should you test with first?', options: [{ id: 'a', label: 'Three to five' }, { id: 'b', label: 'A thousand' }, { id: 'c', label: 'None, just launch' }] },
                { id: 'q6', prompt: 'Three of five testers say the price is too high. Next step?', options: [{ id: 'a', label: 'Ignore them' }, { id: 'b', label: 'Double the price' }, { id: 'c', label: 'Test a cheaper option or a better-value bundle' }] },
            ],
        },
        answerKey: { correct: { q1: 'b', q2: 'c', q3: 'a', q4: 'b', q5: 'a', q6: 'c' } },
    },
    {
        key: 'e-w3-d3', pathway: 'enterprise', week: 3, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 200, tokens: 20,
        title: 'Build a quick prototype',
        story: 'Make a paper sketch, a mock-up or a short demo of your solution. Show it to one person and watch what they do.',
        config: form([
            file('prototype', 'A photo, screenshot, PDF or short video of your prototype', ['image', 'pdf', 'video'], { required: true }),
            line('feedback', 'What happened when someone tried it'),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'e-w3-d7', pathway: 'enterprise', week: 3, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 25, xp: 1000, tokens: 40,
        title: 'Boss challenge: Innovation Studio demo',
        story: 'Demo your prototype, share what your tests showed and the one big change you made.',
        badge: { key: 'innovator', label: 'Innovator' },
        config: form([
            video('demo', 'Prototype demo video (up to 2 minutes)', 120),
            area('findings', 'What your tests showed', 15, { maxWords: 150 }),
            area('revision', 'The big change you made, and why', 10, { maxWords: 120 }),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 4 — Refine, pitch & get ready ──────────────────────────────────
    {
        key: 'e-w4-d2', pathway: 'enterprise', week: 4, day: 1, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 100, tokens: 10,
        title: 'Startup Decision Lab',
        story: 'Make ethical choices about pricing, quality and promises in a simulated startup.',
        config: {
            intro: 'You run a small skincare brand. Choose wisely.',
            start: 's1',
            nodes: [
                { id: 's1', text: 'A supplier offers cheaper ingredients that aren’t certified safe.', choices: [
                    { id: 's1a', label: 'Decline and keep certified ingredients, even with a lower margin.', next: 's2' },
                    { id: 's1b', label: 'Switch quietly to boost profit.', next: 's2' },
                    { id: 's1c', label: 'Switch but add “natural” to the label.', next: 's2' },
                ] },
                { id: 's2', text: 'An influencer offers to post “I lost 10kg using this cream” for a fee.', choices: [
                    { id: 's2a', label: 'Refuse — the claim is false and misleading.', next: 's3' },
                    { id: 's2b', label: 'Accept — everyone does it.', next: 's3' },
                    { id: 's2c', label: 'Accept but ask for smaller claims.', next: 's3' },
                ] },
                { id: 's3', text: 'A customer reports a skin reaction.', choices: [
                    { id: 's3a', label: 'Apologise, refund, advise seeing a doctor, and review the batch.' },
                    { id: 's3b', label: 'Block the customer.' },
                    { id: 's3c', label: 'Offer a discount if they delete the review.' },
                ] },
            ],
        },
        answerKey: { scores: { s1a: 100, s1b: 0, s1c: 0, s2a: 100, s2b: 0, s2c: 20, s3a: 100, s3b: 0, s3c: 10 } },
    },
    {
        key: 'e-w4-d3', pathway: 'enterprise', week: 4, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 45, xp: 200, tokens: 20,
        title: 'Run a demand test',
        story: 'Get real interest: a waitlist, pre-orders or a sign-up form. Never fake the numbers.',
        config: form([
            file('proof', 'A screenshot of your waitlist, form or orders', ['image', 'pdf'], { required: true }),
            line('result', 'How many people you reached and how many signed up'),
        ], { checklist: [HONEST, NO_PII] }),
    },
    {
        key: 'e-w4-d7', pathway: 'enterprise', week: 4, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'showcase', estMinutes: 30, xp: 1500, tokens: 60,
        title: 'Innovation Showcase (Stage 1 finale)',
        story: 'Your Stage 1 showcase: pitch your problem and solution, and bring your one-pager. Judges score it, and your certificate unlocks when you pass.',
        badge: { key: 'enterprise-stage1', label: 'Enterprise Stage 1 Complete' },
        config: form([
            video('pitch', 'Your 2-minute pitch', 120),
            file('deck', 'Pitch deck or one-pager (PDF)', ['pdf'], { required: true }),
            area('evidence', 'Your Stage 1 story: problem, customers, tests and demand', 30, { maxWords: 250 }),
        ], { checklist: [HONEST, NO_PII] }),
    },
]
