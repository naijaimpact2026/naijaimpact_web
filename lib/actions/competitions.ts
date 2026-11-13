'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeRole } from '@/lib/modushive/config'
import { isR2Configured, presignUpload, presignDownload, getObjectSize } from '@/lib/modushive/r2'
import { measureMetrics } from '@/lib/competitions/metrics'
import {
    NIGERIAN_STATES,
    normalizeAvatar,
    PROOF_CONTENT_TYPES,
    PROOF_MAX_BYTES,
    getLevel,
    isSeasonOpen,
    levelBadgeKey,
    type AvatarConfig,
    type Competition,
    type CompetitionMission,
} from '@/lib/competitions/config'

/*
 * Competition writes. Tables are SELECT-only for clients, so everything goes
 * through the service client after auth + season + ownership checks. XP is
 * only ever awarded by the DB function _unsafe_award_competition_xp, which
 * enforces "once per mission" and the season window itself.
 */

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const PROOF_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
}

async function requireProfile()
{
    const { profile } = await getCurrentUser()
    if (!profile) throw new Error('Unauthorized')
    return profile
}

function friendlyError(e: unknown): string
{
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('season_closed')) return 'This season is not open right now.'
    if (msg.includes('not_joined')) return 'Join the competition first.'
    if (msg.includes('mission_not_found')) return 'That mission is no longer available.'
    if (msg === 'Unauthorized') return 'Please sign in again.'
    return 'Something went wrong. Please try again.'
}

async function loadMission(missionId: string): Promise<{ mission: CompetitionMission; competition: Competition } | null>
{
    const db = createServiceClient()
    const { data: mission } = await db.from('competition_missions').select('*').eq('id', missionId).eq('is_active', true).maybeSingle()
    if (!mission) return null
    const { data: competition } = await db.from('competitions').select('*').eq('id', mission.competition_id).maybeSingle()
    if (!competition) return null
    return { mission: mission as CompetitionMission, competition: competition as Competition }
}

async function isParticipant(competitionId: string, userId: string)
{
    const { data } = await createServiceClient()
        .from('competition_participants')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('user_id', userId)
        .maybeSingle()
    return Boolean(data)
}

/** Calls the DB award function, then grants any level badges newly reached. */
async function award(userId: string, mission: CompetitionMission, competition: Competition, source: 'auto' | 'proof' | 'checkin')
{
    const db = createServiceClient()
    const { data, error } = await db.rpc('_unsafe_award_competition_xp', {
        p_user_id: userId,
        p_mission_id: mission.id,
        p_source: source,
    })
    if (error) throw new Error(error.message)
    const awarded = Number(data ?? 0)
    if (awarded > 0) await grantLevelBadges(userId, competition)
    return awarded
}

async function grantLevelBadges(userId: string, competition: Competition)
{
    const db = createServiceClient()
    const { data: events } = await db
        .from('competition_xp_events')
        .select('amount')
        .eq('competition_id', competition.id)
        .eq('user_id', userId)
    const xp = (events ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const { level, name } = getLevel(xp)
    if (level < 2) return

    const keys = Array.from({ length: level - 1 }, (_, i) => levelBadgeKey(competition.slug, i + 2))
    const { data: existing } = await db.from('user_badges').select('badge_key').eq('user_id', userId).in('badge_key', keys)
    const have = new Set((existing ?? []).map((b: { badge_key: string }) => b.badge_key))
    // Only the badge for the level just reached is shown; lower ones are implied.
    const key = levelBadgeKey(competition.slug, level)
    if (have.has(key)) return
    const short = competition.name.replace(/ (Competition|Challenge)$/i, '')
    await db.from('user_badges').insert({ user_id: userId, badge_key: key, label: `${short} · ${name}`, icon: 'trophy' })
}

function revalidateCompetition(slug: string)
{
    revalidatePath(`/app/competitions/${slug}`)
    revalidatePath('/app/competitions')
}

// ─── Join / avatar ───────────────────────────────────────────────────────────

interface JoinInput
{
    competitionId: string
    state?: string | null
    category?: string | null
    avatar?: AvatarConfig
}

function cleanAvatar(a?: AvatarConfig): AvatarConfig
{
    return normalizeAvatar(a)
}

export async function joinCompetition(input: JoinInput): Promise<ActionResult>
{
    try
    {
        const profile = await requireProfile()
        const db = createServiceClient()
        const { data: competition } = await db.from('competitions').select('*').eq('id', input.competitionId).maybeSingle()
        if (!competition) return { ok: false, error: 'Competition not found.' }
        if (competition.status !== 'live') return { ok: false, error: 'This competition is not open yet.' }
        if (competition.season_end && Date.now() > new Date(competition.season_end).getTime())
            return { ok: false, error: 'This season has ended.' }

        const state = input.state && (NIGERIAN_STATES as readonly string[]).includes(input.state) ? input.state : null
        const category = input.category?.trim().slice(0, 60) || null

        const { error } = await db.from('competition_participants').upsert(
            { competition_id: competition.id, user_id: profile.id, state, category, avatar: cleanAvatar(input.avatar) },
            { onConflict: 'competition_id,user_id', ignoreDuplicates: true },
        )
        if (error) return { ok: false, error: 'Could not join. Please try again.' }

        revalidateCompetition(competition.slug)
        return { ok: true }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

export async function updateParticipant(input: JoinInput): Promise<ActionResult>
{
    try
    {
        const profile = await requireProfile()
        const db = createServiceClient()
        const state = input.state && (NIGERIAN_STATES as readonly string[]).includes(input.state) ? input.state : null
        const { data, error } = await db
            .from('competition_participants')
            .update({ state, avatar: cleanAvatar(input.avatar) })
            .eq('competition_id', input.competitionId)
            .eq('user_id', profile.id)
            .select('competition:competitions(slug)')
            .maybeSingle()
        if (error || !data) return { ok: false, error: 'Could not save. Please try again.' }
        const slug = (data as unknown as { competition: { slug: string } | null }).competition?.slug
        if (slug) revalidateCompetition(slug)
        return { ok: true }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

// ─── Auto missions ───────────────────────────────────────────────────────────

/** Re-checks an auto mission against live data and awards it if the target is met. */
export async function claimMission(missionId: string): Promise<ActionResult<{ xp: number }>>
{
    try
    {
        const profile = await requireProfile()
        const loaded = await loadMission(missionId)
        if (!loaded) return { ok: false, error: 'That mission is no longer available.' }
        const { mission, competition } = loaded
        if (mission.verification !== 'auto' || !mission.auto_metric) return { ok: false, error: 'This mission can’t be claimed this way.' }
        if (!isSeasonOpen(competition)) return { ok: false, error: 'This season is not open right now.' }

        const db = createServiceClient()
        const { data: participant } = await db
            .from('competition_participants').select('joined_at')
            .eq('competition_id', competition.id).eq('user_id', profile.id).maybeSingle()
        if (!participant) return { ok: false, error: 'Join the competition first.' }

        const metrics = await measureMetrics(
            db,
            { userId: profile.id, authId: profile.auth_id || profile.id, since: competition.season_start ?? participant.joined_at },
            [mission.auto_metric],
        )
        const value = metrics[mission.auto_metric] ?? 0
        if (value < mission.target) return { ok: false, error: `Not yet — ${value}/${mission.target} done.` }

        const xp = await award(profile.id, mission, competition, 'auto')
        revalidateCompetition(competition.slug)
        return { ok: true, xp }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

// ─── Check-in missions ───────────────────────────────────────────────────────

export async function checkInMission(missionId: string): Promise<ActionResult<{ xp: number }>>
{
    try
    {
        const profile = await requireProfile()
        const loaded = await loadMission(missionId)
        if (!loaded) return { ok: false, error: 'That mission is no longer available.' }
        const { mission, competition } = loaded
        if (mission.verification !== 'checkin') return { ok: false, error: 'This mission needs to be verified.' }

        const xp = await award(profile.id, mission, competition, 'checkin')
        revalidateCompetition(competition.slug)
        return { ok: true, xp }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

// ─── Proof missions ──────────────────────────────────────────────────────────

/** Step 1 (optional): get a presigned R2 URL for a proof file. */
export async function createProofUpload(input: { missionId: string; contentType: string; sizeBytes: number }): Promise<ActionResult<{ uploadUrl: string; key: string }>>
{
    try
    {
        if (!isR2Configured()) return { ok: false, error: 'File uploads are not switched on yet. Paste a link instead.' }
        const profile = await requireProfile()
        const ext = PROOF_EXTENSIONS[input.contentType]
        if (!ext || !(PROOF_CONTENT_TYPES as readonly string[]).includes(input.contentType))
            return { ok: false, error: 'Upload a JPG, PNG, WebP or PDF.' }
        if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > PROOF_MAX_BYTES)
            return { ok: false, error: 'Files must be 10 MB or smaller.' }

        const loaded = await loadMission(input.missionId)
        if (!loaded || loaded.mission.verification !== 'proof') return { ok: false, error: 'That mission is no longer available.' }
        if (!isSeasonOpen(loaded.competition)) return { ok: false, error: 'This season is not open right now.' }

        const key = `competitions/proofs/${profile.id}/${loaded.mission.id}/${randomUUID()}.${ext}`
        const uploadUrl = await presignUpload(key, input.contentType, input.sizeBytes)
        return { ok: true, uploadUrl, key }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

/** Step 2: record the submission for admin review. */
export async function submitProof(input: { missionId: string; key?: string | null; link?: string | null; note?: string | null }): Promise<ActionResult>
{
    try
    {
        const profile = await requireProfile()
        const loaded = await loadMission(input.missionId)
        if (!loaded || loaded.mission.verification !== 'proof') return { ok: false, error: 'That mission is no longer available.' }
        const { mission, competition } = loaded
        if (!isSeasonOpen(competition)) return { ok: false, error: 'This season is not open right now.' }
        if (!(await isParticipant(competition.id, profile.id))) return { ok: false, error: 'Join the competition first.' }

        let key: string | null = null
        if (input.key)
        {
            // Must be a key we issued to this user for this mission, and the upload must have landed.
            const prefix = `competitions/proofs/${profile.id}/${mission.id}/`
            if (!input.key.startsWith(prefix) || input.key.includes('..')) return { ok: false, error: 'Upload not found. Please try again.' }
            const size = await getObjectSize(input.key)
            if (!size || size > PROOF_MAX_BYTES) return { ok: false, error: 'Upload not found. Please try again.' }
            key = input.key
        }

        let link: string | null = null
        if (input.link?.trim())
        {
            try
            {
                const u = new URL(input.link.trim())
                if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('bad')
                link = u.toString().slice(0, 1000)
            } catch { return { ok: false, error: 'That link doesn’t look right.' } }
        }
        if (!key && !link) return { ok: false, error: 'Add a file or a link as proof.' }

        const { error } = await createServiceClient().from('competition_submissions').insert({
            competition_id: competition.id,
            mission_id: mission.id,
            user_id: profile.id,
            proof_r2_key: key,
            proof_link: link,
            note: input.note?.trim().slice(0, 500) || null,
        })
        if (error)
        {
            if (error.code === '23505') return { ok: false, error: 'You already have a submission for this mission.' }
            return { ok: false, error: 'Could not submit. Please try again.' }
        }

        revalidateCompetition(competition.slug)
        revalidatePath('/app/competitions/review')
        return { ok: true }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

// ─── Admin review ────────────────────────────────────────────────────────────

async function requireAdmin()
{
    const profile = await requireProfile()
    if (normalizeRole(profile.role) !== 'admin') throw new Error('Unauthorized')
    return profile
}

export async function getProofUrl(submissionId: string): Promise<ActionResult<{ url: string }>>
{
    try
    {
        await requireAdmin()
        const { data } = await createServiceClient().from('competition_submissions').select('proof_r2_key').eq('id', submissionId).maybeSingle()
        if (!data?.proof_r2_key) return { ok: false, error: 'No file on this submission.' }
        return { ok: true, url: await presignDownload(data.proof_r2_key, 15 * 60) }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}

export async function reviewSubmission(input: { submissionId: string; approve: boolean; note?: string | null }): Promise<ActionResult<{ xp: number }>>
{
    try
    {
        const admin = await requireAdmin()
        const db = createServiceClient()

        // Claim the row atomically: only a still-pending submission can be reviewed.
        const { data: sub, error } = await db
            .from('competition_submissions')
            .update({
                status: input.approve ? 'approved' : 'rejected',
                reviewer_id: admin.id,
                review_note: input.note?.trim().slice(0, 500) || null,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', input.submissionId)
            .eq('status', 'pending')
            .select('user_id, mission_id')
            .maybeSingle()
        if (error || !sub) return { ok: false, error: 'This submission was already reviewed.' }

        let xp = 0
        if (input.approve)
        {
            const loaded = await loadMission(sub.mission_id)
            if (loaded)
            {
                try { xp = await award(sub.user_id, loaded.mission, loaded.competition, 'proof') }
                catch (e)
                {
                    // Season closed after they submitted: keep it approved, explain why no XP.
                    revalidatePath('/app/competitions/review')
                    return { ok: false, error: `Approved, but no XP: ${friendlyError(e)}` }
                }
                revalidateCompetition(loaded.competition.slug)
            }
        }

        revalidatePath('/app/competitions/review')
        return { ok: true, xp }
    } catch (e) { return { ok: false, error: friendlyError(e) } }
}
