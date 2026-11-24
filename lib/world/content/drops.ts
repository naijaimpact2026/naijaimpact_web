import type { Pathway } from '../types'

/*
 * Daily campus drops: one-tap cards found around the 3D Campus. One a day per
 * player, picked from the pool for their pathway (shared cards + pathway
 * cards). They teach one small, useful thing; they never count towards stars.
 * `answer` and `explain` stay on the server until the player answers.
 */

export interface DropCard
{
    key: string
    pathway: Pathway | 'both'
    prompt: string
    options: { id: string; label: string }[]
    answer: string
    /** One or two sentences shown after answering. */
    explain: string
}

const MF = [{ id: 'myth', label: 'Myth' }, { id: 'fact', label: 'Fact' }]
const mf = (key: string, pathway: DropCard['pathway'], prompt: string, answer: 'myth' | 'fact', explain: string): DropCard => ({ key, pathway, prompt, options: MF, answer, explain })
const pick = (key: string, pathway: DropCard['pathway'], prompt: string, options: string[], answer: number, explain: string): DropCard =>
    ({ key, pathway, prompt, options: options.map((label, i) => ({ id: String.fromCharCode(97 + i), label })), answer: String.fromCharCode(97 + answer), explain })

export const DROP_CARDS: DropCard[] = [
    // ─── Everyone ────────────────────────────────────────────────────────────
    mf('d-bvn', 'both', 'Sharing your BVN in a WhatsApp chat is safe if the person says they work for a bank.', 'myth', 'Banks never ask for your BVN or PIN by chat or call. Treat it as a scam.'),
    mf('d-network', 'both', 'Many jobs are filled through people who already know the candidate.', 'fact', 'Referrals are a big source of hires. Talking to people is part of job hunting.'),
    pick('d-email', 'both', 'Which email subject line is best for an application?', ['Hi', 'Application: Graphic Designer, Ada Obi', 'URGENT pls reply'], 1, 'Say what it is and who you are, so the reader can find it later.'),
    mf('d-ai-facts', 'both', 'AI chatbots can state wrong facts with full confidence.', 'fact', 'Always check important facts from an AI against a trusted source.'),
    pick('d-password', 'both', 'Which password is strongest?', ['Ada2004', 'password123', 'Mango-Bicycle-Rain-47'], 2, 'Long passphrases are strong and easier to remember than random symbols.'),
    mf('d-cert-only', 'both', 'Employers only care about your certificate, not what you can show.', 'myth', 'Proof of work, like projects and a portfolio, often decides who gets the job.'),
    pick('d-avg', 'both', 'Sales were ₦10k, ₦20k and ₦30k. What is the average?', ['₦20k', '₦60k', '₦30k'], 0, 'Add them up (₦60k) and divide by 3.'),
    mf('d-free-tools', 'both', 'You need expensive software to build a portfolio.', 'myth', 'Free tools like Canva, Google Docs and Google Sites are enough to start.'),
    pick('d-phish', 'both', 'An SMS says your account is blocked and gives a link. You…', ['Click it quickly', 'Call your bank on the number on their website', 'Forward it to friends'], 1, 'Never use links in surprise messages. Contact the bank directly.'),
    mf('d-sleep', 'both', 'Sleep helps you remember what you studied.', 'fact', 'Your brain stores new learning while you sleep. All-nighters work against you.'),
    pick('d-meeting', 'both', 'In an online meeting, when you are not speaking you should…', ['Stay unmuted', 'Mute your mic', 'Leave your camera pointed at the ceiling'], 1, 'Muting keeps background noise out and shows respect for the speaker.'),
    mf('d-feedback', 'both', 'Asking for feedback makes you look weak.', 'myth', 'People who ask for feedback improve faster, and managers notice it.'),
    pick('d-chart', 'both', 'Which chart best shows change over time?', ['Pie chart', 'Line chart', 'Word cloud'], 1, 'Line charts show how something rises or falls over time.'),
    mf('d-linkedin', 'both', 'Students are too young to have a LinkedIn profile.', 'myth', 'Students can and should. Projects, volunteering and clubs all count.'),
    pick('d-budget', 'both', 'You earn ₦20,000 a month. A good first habit is to…', ['Spend it all and save next month', 'Save a fixed part as soon as it arrives', 'Lend it all out'], 1, 'Paying yourself first makes saving automatic.'),
    mf('d-typos', 'both', 'One typo in a CV does not matter.', 'myth', 'Recruiters read quickly, and typos suggest carelessness. Proofread every time.'),
    pick('d-deadline', 'both', 'You will miss a deadline. What is best?', ['Say nothing', 'Tell them early and propose a new date', 'Send half-done work with no note'], 1, 'Early, honest updates keep trust.'),
    mf('d-skills-learn', 'both', 'You can learn many job skills for free online.', 'fact', 'Free courses, YouTube and practice projects can take you a long way.'),
    pick('d-file', 'both', 'Best way to share a big file with a team?', ['A shared cloud folder link', '20 WhatsApp messages', 'Printing it'], 0, 'A shared link keeps one version everyone can open.'),
    mf('d-introvert', 'both', 'Quiet people cannot be good leaders.', 'myth', 'Many strong leaders are quiet. Listening and clear thinking matter more than volume.'),
    pick('d-photo-consent', 'both', 'Before posting a photo of someone for a project, you should…', ['Just post it', 'Ask their permission, or hide their face', 'Crop it a little'], 1, 'Consent first. Hide faces when you are not sure.'),
    mf('d-small-steps', 'both', 'Big goals are easier when broken into small weekly steps.', 'fact', 'Small, measurable steps make progress visible and keep you going.'),
    pick('d-percent', 'both', 'A ₦5,000 bag is 20% off. What do you pay?', ['₦4,000', '₦4,800', '₦1,000'], 0, '20% of ₦5,000 is ₦1,000, so you pay ₦4,000.'),
    mf('d-wifi', 'both', 'Public Wi-Fi is safe for banking apps.', 'myth', 'Use mobile data for banking. Public Wi-Fi can be watched.'),
    pick('d-handshake', 'both', 'The first few seconds of an interview are best used to…', ['Greet, smile and say thank you for the chance', 'Ask about salary', 'Check your phone'], 0, 'A warm, polite start sets the tone.'),

    // ─── Career & Employability ──────────────────────────────────────────────
    mf('c-onepage', 'career', 'For an entry-level job, a one-page CV is usually enough.', 'fact', 'Short and clear wins. Put your strongest, most relevant points first.'),
    pick('c-cvline', 'career', 'Which CV line is strongest?', ['Good team player', 'Led a 5-person project that raised ₦120k', 'Very passionate'], 1, 'Actions with numbers beat adjectives.'),
    mf('c-cv-religion', 'career', 'You should put your religion and home address on your CV.', 'myth', 'Leave out personal details like religion, BVN and full address.'),
    pick('c-star', 'career', 'In the STAR answer method, what does the A stand for?', ['Attitude', 'Action', 'Answer'], 1, 'Situation, Task, Action, Result. The Action is what you did.'),
    mf('c-volunteer', 'career', 'Volunteering counts as real experience on a CV.', 'fact', 'Say what you did and the result. Employers value it.'),
    pick('c-research', 'career', 'Before an interview, you should…', ['Research the company', 'Hope for easy questions', 'Arrive late to look busy'], 0, 'Knowing what they do helps you give better answers.'),
    mf('c-same-cv', 'career', 'Send the exact same CV to every job.', 'myth', 'Tailor it. Match your strongest points to what each job asks for.'),
    pick('c-question', 'career', 'At the end of an interview, when asked “any questions?”, you…', ['Say no', 'Ask about the team or what success looks like in the role', 'Ask how soon you can take leave'], 1, 'A thoughtful question shows interest.'),
    mf('c-durable', 'career', 'Skills like teamwork and problem solving stay valuable as AI grows.', 'fact', 'Human skills are hard to automate and travel across jobs.'),
    pick('c-thankyou', 'career', 'After an interview, a good move is to…', ['Send a short thank-you message', 'Call them every day', 'Say nothing ever'], 0, 'A brief thank-you keeps you remembered.'),
    mf('c-internship', 'career', 'Unpaid work is the only way to start a career.', 'myth', 'Projects, freelancing, volunteering and paid internships are all routes in.'),
    pick('c-bio', 'career', 'A strong professional bio is…', ['Short, honest and specific', 'A list of every hobby', 'Full of big claims you cannot prove'], 0, 'Say who you are, what you do well and what you are working towards.'),
    mf('c-portfolio', 'career', 'A Google Drive folder can work as a first portfolio.', 'fact', 'Organise your best work with short captions and share the link.'),
    pick('c-goal', 'career', 'Which goal is SMART?', ['Get better at Excel', 'Finish a free Excel course and build one budget by 15 Dec', 'Be successful'], 1, 'Specific, measurable and time-bound goals are easier to reach.'),
    mf('c-mentor', 'career', 'A mentor has to be famous to be useful.', 'myth', 'Anyone a few steps ahead of you can be a great mentor.'),

    // ─── Enterprise Development ──────────────────────────────────────────────
    mf('e-problem-first', 'enterprise', 'Strong businesses usually start with a problem, not a product.', 'fact', 'Find who is struggling and why. The product comes after.'),
    pick('e-ask', 'enterprise', 'Best question for a customer interview?', ['Would you buy my app?', 'When did this problem last happen to you?', 'Don’t you love my idea?'], 1, 'Ask about real past behaviour, not opinions about your idea.'),
    mf('e-friends', 'enterprise', 'If your friends love your idea, the market will too.', 'myth', 'Friends are polite. Test with strangers who have the problem.'),
    pick('e-margin', 'enterprise', 'It costs ₦900 to make a lunch pack. Which price keeps a healthy margin?', ['₦950', '₦1,400', '₦800'], 1, 'Leave room for costs you forgot, like transport and packaging.'),
    mf('e-preorder', 'enterprise', 'A pre-order is stronger evidence than “I would buy it”.', 'fact', 'Money or a firm commitment shows real demand.'),
    pick('e-mvp', 'enterprise', 'Cheapest first test of a tutoring business?', ['Rent an office', 'Offer three sessions through WhatsApp', 'Build an app'], 1, 'Test with the simplest version before spending money.'),
    mf('e-competitors', 'enterprise', 'If nobody else does it, there is definitely no competition.', 'myth', 'People always solve problems somehow. Those workarounds are your competition.'),
    pick('e-profit', 'enterprise', 'You sell 100 items at ₦500 each. Each costs ₦300. What is the gross profit?', ['₦50,000', '₦20,000', '₦30,000'], 1, '₦500 minus ₦300 is ₦200 per item, times 100 is ₦20,000.'),
    mf('e-records', 'enterprise', 'Keeping simple records of sales and costs helps a small business grow.', 'fact', 'You cannot improve what you do not measure. A notebook or spreadsheet is enough.'),
    pick('e-segment', 'enterprise', 'Which is a clear customer segment?', ['Everyone', 'Students in Yaba who print assignments weekly', 'People with money'], 1, 'Specific customers are easier to reach and understand.'),
    mf('e-loan-first', 'enterprise', 'You need a big loan before you can start a business.', 'myth', 'Many businesses start small and test cheaply before borrowing.'),
    pick('e-feedback', 'enterprise', 'Testers keep getting stuck on the same step. You…', ['Fix that step and test again', 'Blame the testers', 'Add more features'], 0, 'Fix the biggest problem first, then retest.'),
    mf('e-claims', 'enterprise', 'It is fine to make bold health claims about a product to boost sales.', 'myth', 'False claims break trust and can break the law. Be honest.'),
    pick('e-pitch', 'enterprise', 'A good pitch starts with…', ['The problem and who has it', 'Your logo', 'How much money you want'], 0, 'Make people feel the problem first.'),
    mf('e-cash', 'enterprise', 'Accepting transfers and cards can help a shop make more sales.', 'fact', 'Many customers carry little cash. More ways to pay means fewer lost sales.'),
]

/** The cards a player can get: shared ones plus their pathway's. */
export function dropPool(pathway: Pathway): DropCard[]
{
    return DROP_CARDS.filter((c) => c.pathway === 'both' || c.pathway === pathway)
}
