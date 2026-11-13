import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { measureMetrics } from './metrics'
import type {
    Competition,
    CompetitionMission,
    CompetitionParticipant,
    CompetitionSubmission,
    CompetitionZone,
    LeaderboardEntry,
    LeaderboardGroup,
    MissionView,
} from './config'

/*
 * Read-side competition queries for Server Components. Uses the service
 * client (leaderboards join users' *public* columns only) and degrades to
 * empty results if the migration hasn't been applied yet.
 */

const PUBLIC_USER_COLUMNS = 'id, username, display_name, avatar_url, verified'

export async function listCompetitions(): Promise<Competition[]>
{
    const { data, error } = await createServiceClient()
        .from('competitions')
        .select('*')
        .order('sort_order', { ascending: true })
    if (error || !data) return []
    return data as Competition[]
}

export async function getCompetition(slug: string): Promise<Competition | null>
{
    const { data, error } = await createServiceClient()
        .from('competitions')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
    if (error || !data) return null
    return data as Competition
}

export async function getParticipantCounts(): Promise<Record<string, number>>
{
    const { data, error } = await createServiceClient()
        .from('competition_participants')
        .select('competition_id')
        .limit(50000)
    if (error || !data) return {}
    const counts: Record<string, number> = {}
    for (const r of data as { competition_id: string }[]) counts[r.competition_id] = (counts[r.competition_id] ?? 0) + 1
    return counts
}

export interface LeaderboardFilter
{
    group?: LeaderboardGroup
    value?: string | null
}

export async function getLeaderboard(competitionId: string, filter: LeaderboardFilter = {}, limit = 50): Promise<LeaderboardEntry[]>
{
    const db = createServiceClient()
    let query = db
        .from('competition_scores')
        .select('user_id, xp, missions_completed, state, category, last_xp_at')
        .eq('competition_id', competitionId)
        .order('xp', { ascending: false })
        .order('last_xp_at', { ascending: true, nullsFirst: false })
        .limit(limit)
    if (filter.group === 'state' && filter.value) query = query.eq('state', filter.value)
    if (filter.group === 'category' && filter.value) query = query.eq('category', filter.value)

    const { data, error } = await query
    if (error || !data || data.length === 0) return []

    const rows = data as { user_id: string; xp: number; missions_completed: number; state: string | null; category: string | null }[]
    const { data: users } = await db.from('users').select(PUBLIC_USER_COLUMNS).in('id', rows.map((r) => r.user_id))
    const byId = new Map((users ?? []).map((u: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>) => [u.id, u]))

    return rows.map((r, i) =>
    {
        const u = byId.get(r.user_id)
        return {
            rank: i + 1,
            user_id: r.user_id,
            xp: r.xp,
            missions_completed: r.missions_completed,
            state: r.state,
            category: r.category,
            username: u?.username ?? null,
            display_name: u?.display_name ?? null,
            avatar_url: u?.avatar_url ?? null,
            verified: Boolean(u?.verified),
        }
    })
}

export interface CompetitionDetail
{
    competition: Competition
    zones: CompetitionZone[]
    missions: MissionView[]
    participant: CompetitionParticipant | null
    myXp: number
    myRank: number | null
    participantCount: number
    leaderboard: LeaderboardEntry[]
    /** Distinct states among participants, for the leaderboard filter. */
    states: string[]
}

export async function getCompetitionDetail(slug: string, profile: User | null): Promise<CompetitionDetail | null>
{
    const competition = await getCompetition(slug)
    if (!competition) return null

    const db = createServiceClient()
    const [zonesRes, missionsRes, participantRes, countRes, leaderboard, statesRes] = await Promise.all([
        db.from('competition_zones').select('*').eq('competition_id', competition.id).order('sort_order'),
        db.from('competition_missions').select('*').eq('competition_id', competition.id).eq('is_active', true).order('sort_order'),
        profile
            ? db.from('competition_participants').select('*').eq('competition_id', competition.id).eq('user_id', profile.id).maybeSingle()
            : Promise.resolve({ data: null }),
        db.from('competition_participants').select('id', { count: 'exact', head: true }).eq('competition_id', competition.id),
        getLeaderboard(competition.id),
        db.from('competition_participants').select('state').eq('competition_id', competition.id).not('state', 'is', null).limit(5000),
    ])

    const zones = (zonesRes.data ?? []) as CompetitionZone[]
    const missions = (missionsRes.data ?? []) as CompetitionMission[]
    const participant = (participantRes.data ?? null) as CompetitionParticipant | null

    let completedIds = new Set<string>()
    let submissions = new Map<string, CompetitionSubmission>()
    let progress: Record<string, number> = {}
    let myXp = 0
    let myRank: number | null = null

    if (profile && participant)
    {
        const [eventsRes, subsRes, metrics] = await Promise.all([
            db.from('competition_xp_events').select('mission_id, amount').eq('competition_id', competition.id).eq('user_id', profile.id),
            db.from('competition_submissions').select('id, mission_id, status, review_note, created_at')
                .eq('competition_id', competition.id).eq('user_id', profile.id).order('created_at', { ascending: false }),
            measureMetrics(
                db,
                { userId: profile.id, authId: profile.auth_id || profile.id, since: competition.season_start ?? participant.joined_at },
                missions.filter((m) => m.verification === 'auto' && m.auto_metric).map((m) => m.auto_metric!),
            ),
        ])
        const events = (eventsRes.data ?? []) as { mission_id: string | null; amount: number }[]
        completedIds = new Set(events.map((e) => e.mission_id).filter(Boolean) as string[])
        myXp = events.reduce((sum, e) => sum + e.amount, 0)
        // Latest submission per mission (list is newest-first).
        for (const s of (subsRes.data ?? []) as CompetitionSubmission[]) if (!submissions.has(s.mission_id)) submissions.set(s.mission_id, s)
        progress = metrics

        const { count } = await db
            .from('competition_scores')
            .select('user_id', { count: 'exact', head: true })
            .eq('competition_id', competition.id)
            .gt('xp', myXp)
        myRank = (count ?? 0) + 1
    }

    const missionViews: MissionView[] = missions.map((m) => ({
        ...m,
        completed: completedIds.has(m.id),
        progress: m.verification === 'auto' && m.auto_metric && participant ? Math.min(progress[m.auto_metric] ?? 0, m.target) : null,
        submission: submissions.get(m.id) ?? null,
    }))

    const states = [...new Set(((statesRes.data ?? []) as { state: string }[]).map((r) => r.state))].sort()

    return {
        competition,
        zones,
        missions: missionViews,
        participant,
        myXp,
        myRank,
        participantCount: countRes.count ?? 0,
        leaderboard,
        states,
    }
}

// ─── Admin review queue ──────────────────────────────────────────────────────

export interface PendingSubmission
{
    id: string
    created_at: string
    proof_r2_key: string | null
    proof_link: string | null
    note: string | null
    competition: { slug: string; name: string } | null
    mission: { title: string; xp: number; proof_hint: string | null } | null
    user: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null
}

export async function listPendingSubmissions(limit = 100): Promise<PendingSubmission[]>
{
    const { data, error } = await createServiceClient()
        .from('competition_submissions')
        .select(`id, created_at, proof_r2_key, proof_link, note,
            competition:competitions(slug, name),
            mission:competition_missions(title, xp, proof_hint),
            user:users!competition_submissions_user_id_fkey(id, username, display_name, avatar_url)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit)
    if (error || !data) return []
    return data as unknown as PendingSubmission[]
}
