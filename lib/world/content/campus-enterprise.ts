import { CONSENT, HONEST, NO_PII, area, file, form, link, num, pick, text, video, type SeedMission } from './types'

/*
 * Enterprise Development pathway — Stage 1 "Identify & Innovate" (weeks 1–4).
 * DRAFT content from the Weeks 1–4 playbook. Simulations are labelled as
 * practice and never count as real validation.
 */

export const ENTERPRISE_STAGE1: SeedMission[] = [
    // ─── Week 1 — Spot problems & opportunities ──────────────────────────────
    {
        key: 'e-w1-d1', pathway: 'enterprise', week: 1, day: 1, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 20, xp: 60, tokens: 5,
        title: 'Community Plaza: three everyday problems',
        story: 'Walk into the Community Plaza. Photograph or describe three everyday problems around you — school, community, market or city — and tag who is affected.',
        config: form([
            area('p1', 'Problem 1 — what happens, where, who is affected', 20), file('p1_photo', 'Photo (optional, no faces)', ['image'], { required: false }),
            area('p2', 'Problem 2 — what happens, where, who is affected', 20), file('p2_photo', 'Photo (optional, no faces)', ['image'], { required: false }),
            area('p3', 'Problem 3 — what happens, where, who is affected', 20), file('p3_photo', 'Photo (optional, no faces)', ['image'], { required: false }),
        ], { checklist: [NO_PII] }),
    },
    {
        key: 'e-w1-d2', pathway: 'enterprise', week: 1, day: 2, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Problem Detective: two interviews',
        story: 'Interview two consenting people about recurring frustrations. Log their exact needs — not their names.',
        config: form([
            text('person1', 'Person 1 — role/context (e.g. “trader at a market”, no name)'),
            area('needs1', 'Their frustrations and exact needs, in their words', 30),
            text('person2', 'Person 2 — role/context (no name)'),
            area('needs2', 'Their frustrations and exact needs, in their words', 30),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w1-d3', pathway: 'enterprise', week: 1, day: 3, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 60, tokens: 5,
        title: 'Problem Explorer: map causes and consequences',
        story: 'Explore the neighbourhood sectors (education, jobs, agriculture, health…). For each shortlisted problem, map its causes, how often it happens and its consequences.',
        config: form([
            pick('sector', 'Main sector', ['Education', 'Jobs & skills', 'Agriculture & food', 'Health', 'Transport', 'Energy', 'Finance', 'Other']),
            area('causes', 'Causes', 20), area('frequency', 'How often / how many people', 10), area('consequences', 'Consequences if nothing changes', 20),
        ], { variant: 'problem_map' }),
    },
    {
        key: 'e-w1-d4', pathway: 'enterprise', week: 1, day: 4, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 70, tokens: 7,
        title: '5 Whys board',
        story: 'Use the 5 Whys board to dig to the root cause of one problem, then note how people work around it today.',
        config: form([
            text('problem', 'The problem'),
            { id: 'whys', label: 'Why?', type: 'text', required: true, repeat: 5 },
            area('root', 'Root cause', 10),
            area('workarounds', 'Current workarounds people use', 15),
        ], { variant: 'five_whys' }),
    },
    {
        key: 'e-w1-d5', pathway: 'enterprise', week: 1, day: 5, kind: 'team', bucket: 'teamwork', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Opportunity Hunt: problem scorecard',
        story: 'With your squad, score three problems on urgency, reach, your ability to act and ethical impact (1–5 each). Rank them.',
        config: form([
            text('squad', 'Squad name'),
            text('a', 'Problem A'), num('a_score', 'Problem A total score (4–20)', 4, 20),
            text('b', 'Problem B'), num('b_score', 'Problem B total score (4–20)', 4, 20),
            text('c', 'Problem C'), num('c_score', 'Problem C total score (4–20)', 4, 20),
            area('ranking', 'Your ranking and why the team agreed', 20),
        ], { variant: 'scorecard', checklist: [HONEST] }),
    },
    {
        key: 'e-w1-d6', pathway: 'enterprise', week: 1, day: 6, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 45, xp: 100, tokens: 10,
        title: 'Reality mission: observe or survey',
        story: 'Safely observe a local process (a queue, a market, a bus park) or survey 10 people online/offline. Upload anonymised findings.',
        config: form([
            pick('method', 'Method', ['Observation', 'Survey (10+ people)']),
            area('findings', 'What you found (numbers if you have them)', 40),
            file('evidence', 'Anonymised photo, notes or survey summary', ['image', 'pdf'], { required: false }),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w1-d7', pathway: 'enterprise', week: 1, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 500, tokens: 20,
        title: 'Boss challenge: Problem Hunter',
        story: 'Pitch one problem and prove it matters — in 90 seconds.',
        badge: { key: 'problem-solver', label: 'Problem Solver' },
        config: form([
            area('problem', 'The problem statement (who, what, how often)', 30),
            area('proof', 'Your evidence it matters (interviews, observation, survey)', 40),
            video('pitch', '90-second pitch video', 90),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 2 — Research & understand the market ───────────────────────────
    {
        key: 'e-w2-d1', pathway: 'enterprise', week: 2, day: 1, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 15, xp: 60, tokens: 5,
        title: 'Market Lab: target customer',
        story: 'Enter the Market Lab. Define your target customer, their use case, and the one assumption you most need to test.',
        config: form([
            area('customer', 'Target customer (be specific)', 15),
            area('use_case', 'When and why they’d use a solution', 15),
            area('assumption', 'Riskiest assumption to test', 10),
        ]),
    },
    {
        key: 'e-w2-d2', pathway: 'enterprise', week: 2, day: 2, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 60, tokens: 5,
        title: 'Neutral interview script',
        story: 'Write six neutral interview questions — no leading questions like “Would you buy my app?”. Practise with the Novi coach.',
        config: form([
            { id: 'questions', label: 'Question', type: 'text', required: true, repeat: 6 },
            area('practice_notes', 'What you changed after practising', 15),
        ], { variant: 'interview_script' }),
    },
    {
        key: 'e-w2-d3', pathway: 'enterprise', week: 2, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 60, xp: 120, tokens: 12,
        title: 'Customer Discovery Quest',
        story: 'Interview three to five consenting prospective customers. Record quotes and unmet needs — anonymised.',
        config: form([
            num('count', 'How many people you interviewed', 3, 20),
            area('quotes', 'Key quotes (anonymised)', 40),
            area('needs', 'Unmet needs you heard more than once', 20),
            area('surprise', 'What surprised you', 10),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w2-d4', pathway: 'enterprise', week: 2, day: 4, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 25, xp: 70, tokens: 7,
        title: 'Competitor Analysis Game',
        story: 'Map three alternatives or competitors (including “doing nothing”). Compare price, access, strengths and weaknesses.',
        config: form([
            area('c1', 'Alternative 1 — price, access, strengths, weaknesses', 20),
            area('c2', 'Alternative 2', 20),
            area('c3', 'Alternative 3', 20),
            area('advantage', 'Where you could be better', 15),
        ], { variant: 'competitor_map' }),
    },
    {
        key: 'e-w2-d5', pathway: 'enterprise', week: 2, day: 5, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 60, tokens: 5,
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
        key: 'e-w2-d6', pathway: 'enterprise', week: 2, day: 6, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 45, xp: 100, tokens: 10,
        title: 'Reality mission: test one assumption',
        story: 'Test your riskiest assumption with three more people. Rate your confidence and note any evidence that contradicts you.',
        config: form([
            area('assumption', 'The assumption you tested', 10),
            area('results', 'What happened with each person (anonymised)', 30),
            pick('confidence', 'Confidence the assumption is true now', ['Low', 'Medium', 'High']),
            area('contradicting', 'Contradicting evidence', 10),
        ], { checklist: [CONSENT, NO_PII, HONEST] }),
    },
    {
        key: 'e-w2-d7', pathway: 'enterprise', week: 2, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 750, tokens: 30,
        title: 'Boss challenge: Market Evidence',
        story: 'Present your customer segment, the alternatives they use and five evidence points that show demand.',
        badge: { key: 'market-researcher', label: 'Market Researcher' },
        config: form([
            area('segment', 'Customer segment', 20),
            area('alternatives', 'Alternatives they use today', 20),
            { id: 'evidence', label: 'Evidence point', type: 'textarea', required: true, minWords: 8, repeat: 5 },
            video('pitch', 'Optional: 2-minute presentation video', 120, { required: false }),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 3 — Ideate, build & validate ───────────────────────────────────
    {
        key: 'e-w3-d1', pathway: 'enterprise', week: 3, day: 1, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 70, tokens: 7,
        title: 'Innovation Studio: five solutions',
        story: 'Draw from the creativity card deck to generate five possible solutions. Pick one using desirability and feasibility criteria.',
        config: form([
            { id: 'ideas', label: 'Solution idea', type: 'text', required: true, repeat: 5 },
            text('chosen', 'The one you chose'),
            area('criteria', 'Why — desirability (do people want it?) and feasibility (can you build it?)', 25),
        ]),
    },
    {
        key: 'e-w3-d2', pathway: 'enterprise', week: 3, day: 2, kind: 'canvas', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 20, xp: 70, tokens: 7,
        title: 'Value proposition canvas',
        story: 'Create a one-page value proposition: customer, problem, solution, benefit and key difference.',
        config: form([
            area('customer', 'Customer', 8), area('problem', 'Problem', 10), area('solution', 'Solution', 10),
            area('benefit', 'Main benefit', 8), area('difference', 'Key difference from alternatives', 10),
        ], { variant: 'value_proposition' }),
    },
    {
        key: 'e-w3-d3', pathway: 'enterprise', week: 3, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 100, tokens: 10,
        title: 'Prototype Challenge',
        story: 'Sketch a paper or clickable prototype (product, service or demo video). Share it with a peer for feedback.',
        config: form([
            file('prototype', 'Prototype photo/screens/PDF', ['image', 'pdf', 'video'], { required: false }),
            link('prototype_link', 'Or a link (Figma, video, etc.)', { required: false }),
            area('description', 'What the prototype shows', 20),
            area('peer_feedback', 'Peer feedback you received', 15),
        ], { checklist: [HONEST] }),
    },
    {
        key: 'e-w3-d4', pathway: 'enterprise', week: 3, day: 4, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 60, xp: 120, tokens: 12,
        title: 'Validation Quest: three user tests',
        story: 'Run three structured user tests with consent. Record what users DO, not only what they say.',
        config: form([
            num('participants', 'Number of participants', 3, 30),
            area('observations', 'Observed behaviour (where they got stuck, what they did)', 40),
            area('quotes', 'What they said (anonymised)', 15),
            area('issues', 'Top issues found', 15),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w3-d5', pathway: 'enterprise', week: 3, day: 5, kind: 'reflection', bucket: 'reflection', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Revise & retest',
        story: 'Revise your prototype from the test findings. Define a success metric (e.g. task completed in under 2 minutes) and retest with two people.',
        config: form([
            area('changes', 'What you changed and why', 25),
            text('metric', 'Success metric'),
            area('retest', 'Retest result with 2 people', 15),
            file('revised', 'Revised prototype (optional)', ['image', 'pdf'], { required: false }),
        ], { checklist: [CONSENT, NO_PII] }),
    },
    {
        key: 'e-w3-d6', pathway: 'enterprise', week: 3, day: 6, kind: 'canvas', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Business canvas basics',
        story: 'Estimate basic costs, price assumptions and delivery steps on a simple business canvas.',
        config: form([
            area('costs', 'Main costs (with ₦ estimates)', 15),
            area('price', 'Price and why', 10),
            area('delivery', 'How it gets to the customer (steps)', 15),
            area('channels', 'How customers will find you', 10),
        ], { variant: 'business_canvas' }),
    },
    {
        key: 'e-w3-d7', pathway: 'enterprise', week: 3, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'boss', estMinutes: 30, xp: 1000, tokens: 40,
        title: 'Boss challenge: Innovation Studio demo',
        story: 'Demo your prototype, share your test findings and the one major revision you made.',
        badge: { key: 'innovator', label: 'Innovator' },
        config: form([
            video('demo', 'Prototype demo video (up to 2 minutes)', 120),
            area('findings', 'Test findings', 30),
            area('revision', 'The major revision and its effect', 25),
        ], { checklist: [HONEST, NO_PII] }),
    },

    // ─── Week 4 — Refine, pitch & get ready ──────────────────────────────────
    {
        key: 'e-w4-d1', pathway: 'enterprise', week: 4, day: 1, kind: 'canvas', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 30, xp: 80, tokens: 8,
        title: 'Lean business model',
        story: 'Build a lean model: customer, value, channels, costs, revenue and risks.',
        config: form([
            area('customer', 'Customer', 8), area('value', 'Value', 10), area('channels', 'Channels', 8),
            area('costs', 'Costs', 10), area('revenue', 'Revenue', 10), area('risks', 'Risks', 10),
        ], { variant: 'lean_canvas' }),
    },
    {
        key: 'e-w4-d2', pathway: 'enterprise', week: 4, day: 2, kind: 'scenario', bucket: 'quality', reviewMode: 'auto', estMinutes: 15, xp: 70, tokens: 7,
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
        key: 'e-w4-d3', pathway: 'enterprise', week: 4, day: 3, kind: 'evidence', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 60, xp: 120, tokens: 12,
        title: 'Low-cost demand test',
        story: 'Run a low-cost demand test: a waitlist, pre-orders or customer commitments. Never misrepresent sales.',
        config: form([
            pick('test', 'Test type', ['Waitlist', 'Pre-orders', 'Letters of intent', 'Other']),
            num('reached', 'People reached', 1, 1000000),
            num('committed', 'People who signed up / committed', 0, 1000000),
            area('details', 'How you ran it and what it shows', 25),
            link('proof', 'Link to waitlist/form (optional)', { required: false }),
        ], { checklist: [HONEST, NO_PII] }),
    },
    {
        key: 'e-w4-d4', pathway: 'enterprise', week: 4, day: 4, kind: 'board', bucket: 'quality', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 25, xp: 80, tokens: 8,
        title: 'Unit economics calculator',
        story: 'Calculate simple unit economics from transparent assumptions. Label anything you haven’t verified as an estimate.',
        config: form([
            num('price', 'Price per unit (₦)', 0), num('cost', 'Cost per unit (₦)', 0),
            num('units', 'Expected units per month', 0),
            area('assumptions', 'Your assumptions — mark unverified ones as estimates', 20),
        ], { variant: 'unit_economics' }),
    },
    {
        key: 'e-w4-d5', pathway: 'enterprise', week: 4, day: 5, kind: 'live_event', bucket: 'teamwork', reviewMode: 'ai', rubricKey: 'practice', estMinutes: 45, xp: 80, tokens: 8,
        title: 'Founder Marketplace demo hall',
        story: 'Join the Founder Marketplace. Demonstrate your prototype and collect feedback from mentors and peers.',
        config: form([
            area('feedback', 'Feedback you received (no names)', 25),
            area('given', 'Feedback you gave another founder', 15),
            area('action', 'One change you’ll make', 10),
        ], { checklist: [NO_PII] }),
    },
    {
        key: 'e-w4-d6', pathway: 'enterprise', week: 4, day: 6, kind: 'video', bucket: 'evidence', reviewMode: 'ai', rubricKey: 'evidence', estMinutes: 40, xp: 100, tokens: 10,
        title: 'Problem–solution pitch',
        story: 'Record a 2-minute pitch: “My solution, my market, my impact”. Summarise your evidence and next test.',
        config: form([
            video('pitch', '2-minute pitch video', 120),
            area('evidence', 'Evidence summary', 30),
            area('next_test', 'Your next test', 10),
        ]),
    },
    {
        key: 'e-w4-d7', pathway: 'enterprise', week: 4, day: 7, kind: 'boss', bucket: 'showcase', reviewMode: 'human', rubricKey: 'showcase', estMinutes: 40, xp: 1500, tokens: 60,
        title: 'Innovation Showcase (Stage 1 finale)',
        story: 'Submit your Stage 1 evidence bundle and deliver your problem–solution pitch. Judges score it and you receive your readiness score.',
        badge: { key: 'enterprise-stage1', label: 'Enterprise Stage 1 Complete' },
        config: form([
            video('pitch', 'Final 2-minute pitch', 120),
            file('deck', 'Pitch deck or one-pager (PDF)', ['pdf'], { required: true }),
            area('evidence', 'Evidence bundle summary: problem, customers, tests, demand', 80),
            area('next', 'What you’ll build in Stage 2', 30),
        ], { checklist: [HONEST, NO_PII] }),
    },
]
