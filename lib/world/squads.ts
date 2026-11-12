import { randomInt } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { loadMissionRows, loadParticipant, playableWorld, type Result } from './service'
import { semesterClock, unlockAt } from './schedule'
import { addToSquadChat, deleteSquadChat, ensureSquadChat, removeFromSquadChat, renameSquadChat, squadChannelId } from './squad-chat'
import { SQUAD_MAX, SQUAD_MIN, type MissionStatus, type MySquadView, type Pathway, type SquadView } from './types'

/*
 * Hubnovo World squads: teams of 3–5 players in the same pathway, joined by
 * a 6-character invite code (no public listing — players only meet people
 * they were invited by). One squad per player. The 5-player cap is enforced
 * in the database (_unsafe_join_squad locks the squad row).
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const NOT_FOUND = 'Competition not found.'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')

interface SquadRow { id: string; competition_id: string; pathway: Pathway; name: string; code: string; leader_id: string | null; chat_channel_id: string | null; created_at: string }
const SQUAD_COLUMNS = 'id, competition_id, pathway, name, code, leader_id, chat_channel_id, created_at'

/** True when the error means the squads tables aren't in the database yet. */
const missingTable = (e: { code?: string; message?: string } | null) => Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message ?? '')))

const JOIN_ERRORS: Record<string, string> = {
    squad_full: `This squad is full (${SQUAD_MAX} players).`,
    wrong_pathway: 'That squad is in the other pathway. Squads are per pathway.',
    already_in_squad: 'You’re already in a squad. Leave it first.',
    not_joined: 'Join the competition first.',
    squad_not_found: 'No squad with that code.',
}
const joinError = (msg: string) => JOIN_ERRORS[Object.keys(JOIN_ERRORS).find((k) => msg.includes(k)) ?? ''] ?? 'Could not join the squad.'

function cleanName(raw: unknown)
{
    const name = String(raw ?? '').replace(/\s+/g, ' ').trim()
    if (name.length < 2 || name.length > 40) return null
    return name
}

async function context(slug: string, profile: User)
{
    const c = await playableWorld(slug, profile)
    if (!c) return null
    const me = await loadParticipant(c.id, profile.id)
    return { c, me }
}

async function membershipOf(competitionId: string, userId: string): Promise<{ row: SquadRow | null; missing: boolean }>
{
    const db = createServiceClient()
    const { data, error } = await db.from('competition_squad_members').select('squad_id').eq('competition_id', competitionId).eq('user_id', userId).maybeSingle()
    if (error) return { row: null, missing: missingTable(error) }
    if (!data) return { row: null, missing: false }
    const { data: squad } = await db.from('competition_squads').select(SQUAD_COLUMNS).eq('id', (data as { squad_id: string }).squad_id).maybeSingle()
    return { row: (squad as SquadRow | null) ?? null, missing: false }
}

async function buildView(c: { id: string; season_start: string | null; season_end: string | null; weeks: number }, squad: SquadRow, viewerId: string): Promise<SquadView>
{
    const db = createServiceClient()
    const clock = semesterClock(c.season_start, c.season_end, c.weeks)
    const missions = await loadMissionRows(c.id)
    const team = clock.week ? missions.find((m) => m.pathway === squad.pathway && m.week === clock.week && m.kind === 'team') ?? null : null
    const weekStart = clock.week && c.season_start ? new Date(new Date(c.season_start).getTime() + (clock.week - 1) * 7 * 86_400_000).toISOString() : null

    const { data: memberRows } = await db.from('competition_squad_members').select('user_id, joined_at').eq('squad_id', squad.id).order('joined_at')
    const members = (memberRows ?? []) as { user_id: string; joined_at: string }[]
    const ids = members.map((m) => m.user_id)
    const none = { data: [] as unknown[] }
    const [{ data: users }, { data: parts }, { data: xpRows }, { data: weekRows }, { data: attempts }] = await Promise.all([
        db.from('users').select('id, username, display_name, avatar_url').in('id', ids),
        db.from('competition_participants').select('user_id, avatar').eq('competition_id', c.id).in('user_id', ids),
        db.from('competition_scores').select('user_id, xp').eq('competition_id', c.id).in('user_id', ids),
        weekStart ? db.from('competition_xp_events').select('user_id, amount').eq('competition_id', c.id).in('user_id', ids).gte('created_at', weekStart) : none,
        team ? db.from('competition_attempts').select('user_id, status').eq('mission_id', team.id).in('user_id', ids) : none,
    ])
    const u = new Map(((users ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]).map((x) => [x.id, x]))
    const av = new Map(((parts ?? []) as { user_id: string; avatar: { character?: number } | null }[]).map((x) => [x.user_id, Number(x.avatar?.character ?? 0)]))
    const xp = new Map(((xpRows ?? []) as { user_id: string; xp: number }[]).map((x) => [x.user_id, x.xp]))
    const week = new Map<string, number>()
    for (const r of (weekRows ?? []) as { user_id: string; amount: number }[]) week.set(r.user_id, (week.get(r.user_id) ?? 0) + r.amount)
    const rank: Record<MissionStatus, number> = { passed: 5, in_review: 4, needs_revision: 3, rejected: 2, available: 1, locked: 0 }
    const status = new Map<string, MissionStatus>()
    for (const a of (attempts ?? []) as { user_id: string; status: MissionStatus }[])
        if (!status.has(a.user_id) || rank[a.status] > rank[status.get(a.user_id)!]) status.set(a.user_id, a.status)

    const view = members.map((m) => ({
        userId: m.user_id, username: u.get(m.user_id)?.username ?? null, displayName: u.get(m.user_id)?.display_name ?? null,
        avatarUrl: u.get(m.user_id)?.avatar_url ?? null, character: av.get(m.user_id) ?? 0,
        isLeader: m.user_id === squad.leader_id, isMe: m.user_id === viewerId,
        xp: xp.get(m.user_id) ?? 0, weekXp: week.get(m.user_id) ?? 0, teamMission: status.get(m.user_id) ?? null, joinedAt: m.joined_at,
    }))
    return {
        id: squad.id, name: squad.name, code: squad.code, pathway: squad.pathway, leaderId: squad.leader_id, chatChannelId: squad.chat_channel_id,
        members: view, totalXp: view.reduce((s, m) => s + m.xp, 0), weekXp: view.reduce((s, m) => s + m.weekXp, 0),
        min: SQUAD_MIN, max: SQUAD_MAX,
        teamMission: team ? { id: team.id, title: team.title, week: team.week, day: team.day, unlocksAt: unlockAt(c.season_start!, team.week, team.day).toISOString() } : null,
        createdAt: squad.created_at,
    }
}

// ─── Public API (web actions + REST) ─────────────────────────────────────────

export async function getMySquad(slug: string, profile: User): Promise<Result<MySquadView>>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    const { row, missing } = await membershipOf(ctx.c.id, profile.id)
    if (missing) return { ok: true, enabled: false, squad: null }
    return { ok: true, enabled: true, squad: row ? await buildView(ctx.c, row, profile.id) : null }
}

export async function createSquad(slug: string, profile: User, input: { name: unknown }): Promise<Result<{ squad: SquadView }>>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    if (!ctx.me) return fail('Join the competition first.')
    const name = cleanName(input.name)
    if (!name) return fail('Give your squad a name (2–40 characters).')
    const { row: existing, missing } = await membershipOf(ctx.c.id, profile.id)
    if (missing) return fail('Squads are not switched on yet.')
    if (existing) return fail(JOIN_ERRORS.already_in_squad)

    const db = createServiceClient()
    let squad: SquadRow | null = null
    for (let i = 0; i < 5 && !squad; i++)
    {
        const id = crypto.randomUUID()
        const { data, error } = await db.from('competition_squads').insert({
            id, competition_id: ctx.c.id, pathway: ctx.me.pathway, name, code: newCode(), leader_id: profile.id, chat_channel_id: squadChannelId(id),
        }).select(SQUAD_COLUMNS).single()
        if (error && error.code !== '23505') return fail('Could not create the squad.')
        squad = (data as SquadRow | null) ?? null
    }
    if (!squad) return fail('Could not create the squad. Try again.')
    const { error } = await db.rpc('_unsafe_join_squad', { p_squad_id: squad.id, p_user_id: profile.id, p_max: SQUAD_MAX })
    if (error)
    {
        await db.from('competition_squads').delete().eq('id', squad.id)
        return fail(joinError(error.message))
    }
    const [, view] = await Promise.all([ensureSquadChat(squad.chat_channel_id!, name, profile.id, [profile.id]), buildView(ctx.c, squad, profile.id)])
    return { ok: true, squad: view }
}

export async function joinSquad(slug: string, profile: User, input: { code: unknown }): Promise<Result<{ squad: SquadView }>>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    if (!ctx.me) return fail('Join the competition first.')
    const code = String(input.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length !== 6) return fail('Enter the 6-character squad code.')
    const db = createServiceClient()
    const { data, error: findErr } = await db.from('competition_squads').select(SQUAD_COLUMNS).eq('competition_id', ctx.c.id).eq('code', code).maybeSingle()
    if (findErr) return fail(missingTable(findErr) ? 'Squads are not switched on yet.' : 'Could not find that squad.')
    const squad = data as SquadRow | null
    if (!squad) return fail(JOIN_ERRORS.squad_not_found)
    const { error } = await db.rpc('_unsafe_join_squad', { p_squad_id: squad.id, p_user_id: profile.id, p_max: SQUAD_MAX })
    if (error) return fail(joinError(error.message))
    const [, view] = await Promise.all([
        squad.chat_channel_id ? addToSquadChat(squad.chat_channel_id, profile.id, profile.display_name ?? profile.username ?? 'A new player') : null,
        buildView(ctx.c, squad, profile.id),
    ])
    return { ok: true, squad: view }
}

/** Leave your squad (the next-longest member becomes leader; an empty squad is deleted). */
export async function leaveSquad(slug: string, profile: User): Promise<Result>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    const { row } = await membershipOf(ctx.c.id, profile.id)
    if (!row) return fail('You’re not in a squad.')
    return removeMember(row, profile.id)
}

/** Leader only: remove someone from the squad. */
export async function removeSquadMember(slug: string, profile: User, userId: string): Promise<Result>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    const { row } = await membershipOf(ctx.c.id, profile.id)
    if (!row) return fail('You’re not in a squad.')
    if (row.leader_id !== profile.id) return fail('Only the squad leader can remove players.')
    if (userId === profile.id) return fail('Use “Leave squad” to leave.')
    return removeMember(row, userId)
}

async function removeMember(squad: SquadRow, userId: string): Promise<Result>
{
    const db = createServiceClient()
    const { data: gone } = await db.from('competition_squad_members').delete().eq('squad_id', squad.id).eq('user_id', userId).select('user_id')
    if (!gone?.length) return fail('That player isn’t in this squad.')
    const { data: rest } = await db.from('competition_squad_members').select('user_id').eq('squad_id', squad.id).order('joined_at').limit(1)
    const next = (rest ?? [])[0] as { user_id: string } | undefined
    if (!next)
    {
        await db.from('competition_squads').delete().eq('id', squad.id)
        if (squad.chat_channel_id) await deleteSquadChat(squad.chat_channel_id)
        return { ok: true }
    }
    if (squad.leader_id === userId) await db.from('competition_squads').update({ leader_id: next.user_id }).eq('id', squad.id)
    if (squad.chat_channel_id) await removeFromSquadChat(squad.chat_channel_id, userId)
    return { ok: true }
}

/** Leader only: rename the squad. */
export async function renameSquad(slug: string, profile: User, input: { name: unknown }): Promise<Result>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    const { row } = await membershipOf(ctx.c.id, profile.id)
    if (!row) return fail('You’re not in a squad.')
    if (row.leader_id !== profile.id) return fail('Only the squad leader can rename the squad.')
    const name = cleanName(input.name)
    if (!name) return fail('Squad names are 2–40 characters.')
    await createServiceClient().from('competition_squads').update({ name }).eq('id', row.id)
    if (row.chat_channel_id) await renameSquadChat(row.chat_channel_id, name)
    return { ok: true }
}

/** Make sure the squad chat exists and has every member (repairs a failed Stream call). Returns the channel id. */
export async function openSquadChat(slug: string, profile: User): Promise<Result<{ chatChannelId: string }>>
{
    const ctx = await context(slug, profile)
    if (!ctx) return fail(NOT_FOUND)
    const { row } = await membershipOf(ctx.c.id, profile.id)
    if (!row) return fail('You’re not in a squad.')
    const channelId = row.chat_channel_id ?? squadChannelId(row.id)
    const { data } = await createServiceClient().from('competition_squad_members').select('user_id').eq('squad_id', row.id)
    const ok = await ensureSquadChat(channelId, row.name, row.leader_id, ((data ?? []) as { user_id: string }[]).map((m) => m.user_id))
    if (!ok) return fail('Squad chat is unavailable right now. Try again shortly.')
    if (!row.chat_channel_id) await createServiceClient().from('competition_squads').update({ chat_channel_id: channelId }).eq('id', row.id)
    return { ok: true, chatChannelId: channelId }
}

/** Squad name for pre-filling team missions (null if none / squads off). */
export async function mySquadName(competitionId: string, userId: string): Promise<string | null>
{
    const { row } = await membershipOf(competitionId, userId).catch(() => ({ row: null }))
    return row?.name ?? null
}

/** Light summary for the Campus home button (null if no squad / squads off). */
export async function squadSummary(competitionId: string, userId: string): Promise<{ name: string; members: number; needed: number } | null>
{
    try
    {
        const { row } = await membershipOf(competitionId, userId)
        if (!row) return null
        const { count } = await createServiceClient().from('competition_squad_members').select('user_id', { count: 'exact', head: true }).eq('squad_id', row.id)
        const members = count ?? 1
        return { name: row.name, members, needed: Math.max(0, SQUAD_MIN - members) }
    }
    catch { return null }
}
