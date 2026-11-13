import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { notifyWorld } from './notify'
import { isAdmin, loadParticipant, playableWorld, type Result } from './service'
import { TOKENS_LABEL, type RedemptionStatus, type RedemptionView, type RewardKind, type RewardView, type RewardsView } from './types'

/*
 * Rewards Exchange: students spend HubTokens on non-cash rewards. Tokens
 * never buy score or XP, can't be sent to anyone and can't be cashed out.
 *
 * Every spend and refund runs inside a database function
 * (_unsafe_redeem_reward / _unsafe_cancel_redemption, migration
 * 20261113100000_campus_rewards.sql): per-user lock, balance from the
 * hub_token_events ledger, stock and per-user limit, all in one
 * transaction. A client request id makes a double tap spend once.
 *
 * Until that migration runs, everything reports enabled: false.
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const NOT_FOUND = 'Competition not found.'
const OFF = 'The Rewards Exchange is not switched on yet.'
const missingTable = (e: { code?: string; message?: string } | null) =>
    Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST202' || e.code === '42883' || /does not exist|schema cache|could not find the function/i.test(e.message ?? '')))
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const REWARD_KINDS: RewardKind[] = ['course_discount', 'avatar_item', 'event_access', 'merch', 'other']

interface RewardRow
{
    id: string; competition_id: string; title: string; description: string | null; image_url: string | null; cost_tokens: number
    stock: number | null; per_user_limit: number | null; kind: RewardKind; fulfilment: 'auto' | 'manual'; is_active: boolean; sort: number
    created_at: string
}
interface RedemptionRow
{
    id: string; competition_id: string; reward_id: string; user_id: string; cost: number; status: RedemptionStatus; code: string | null
    note: string | null; fulfilled_by: string | null; fulfilled_at: string | null; cancelled_at: string | null; created_at: string
}

const REWARD_COLUMNS = 'id, competition_id, title, description, image_url, cost_tokens, stock, per_user_limit, kind, fulfilment, is_active, sort, created_at'
const REDEMPTION_COLUMNS = 'id, competition_id, reward_id, user_id, cost, status, code, note, fulfilled_by, fulfilled_at, cancelled_at, created_at'

async function tokenBalance(userId: string): Promise<number>
{
    const { data } = await createServiceClient().from('hub_token_events').select('amount').eq('user_id', userId).limit(100000)
    return ((data ?? []) as { amount: number }[]).reduce((s, r) => s + r.amount, 0)
}

function toRedemption(r: RedemptionRow, reward: Pick<RewardRow, 'id' | 'title' | 'kind' | 'image_url'> | undefined): RedemptionView
{
    return {
        id: r.id, reward: { id: r.reward_id, title: reward?.title ?? 'Reward', kind: reward?.kind ?? 'other', imageUrl: reward?.image_url ?? null },
        cost: r.cost, status: r.status, code: r.code, note: r.note, createdAt: r.created_at, fulfilledAt: r.fulfilled_at, cancelledAt: r.cancelled_at,
    }
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function listRewards(slug: string, profile: User): Promise<Result<RewardsView>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    const [{ data, error }, mine, balance] = await Promise.all([
        db.from('competition_rewards').select(REWARD_COLUMNS).eq('competition_id', c.id).eq('is_active', true).order('sort').order('cost_tokens'),
        db.from('competition_redemptions').select('reward_id').eq('competition_id', c.id).eq('user_id', profile.id).neq('status', 'cancelled'),
        tokenBalance(profile.id),
    ])
    if (error) return missingTable(error) ? { ok: true, enabled: false, balance, rewards: [] } : fail('Could not load rewards.')
    const used: Record<string, number> = {}
    for (const r of (mine.data ?? []) as { reward_id: string }[]) used[r.reward_id] = (used[r.reward_id] ?? 0) + 1
    const rewards = ((data ?? []) as RewardRow[]).map((r): RewardView =>
    {
        const redeemedByMe = used[r.id] ?? 0
        const blocked = r.stock !== null && r.stock <= 0 ? 'out_of_stock'
            : r.per_user_limit !== null && redeemedByMe >= r.per_user_limit ? 'limit_reached'
            : balance < r.cost_tokens ? 'insufficient_tokens' : null
        return {
            id: r.id, title: r.title, description: r.description, imageUrl: r.image_url, costTokens: r.cost_tokens, kind: r.kind,
            fulfilment: r.fulfilment, stock: r.stock, perUserLimit: r.per_user_limit, redeemedByMe, blocked,
        }
    })
    return { ok: true, enabled: true, balance, rewards }
}

export async function myRedemptions(slug: string, profile: User): Promise<Result<{ enabled: boolean; redemptions: RedemptionView[] }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    const db = createServiceClient()
    const { data, error } = await db.from('competition_redemptions').select(REDEMPTION_COLUMNS)
        .eq('competition_id', c.id).eq('user_id', profile.id).order('created_at', { ascending: false }).limit(100)
    if (error) return missingTable(error) ? { ok: true, enabled: false, redemptions: [] } : fail('Could not load your redemptions.')
    const rows = (data ?? []) as RedemptionRow[]
    const rewards = await rewardsById(rows.map((r) => r.reward_id))
    return { ok: true, enabled: true, redemptions: rows.map((r) => toRedemption(r, rewards.get(r.reward_id))) }
}

async function rewardsById(ids: string[])
{
    if (ids.length === 0) return new Map<string, RewardRow>()
    const { data } = await createServiceClient().from('competition_rewards').select(REWARD_COLUMNS).in('id', [...new Set(ids)])
    return new Map(((data ?? []) as RewardRow[]).map((r) => [r.id, r]))
}

const REDEEM_ERRORS: Record<string, string> = {
    reward_not_found: 'That reward isn’t available any more.',
    competition_closed: 'The Rewards Exchange is closed.',
    not_joined: 'Join the competition first.',
    out_of_stock: 'Sorry, that reward has run out.',
    limit_reached: 'You’ve already redeemed this reward the maximum number of times.',
    insufficient_tokens: `You don’t have enough ${TOKENS_LABEL} for this yet.`,
}

/** Spend tokens on a reward. Send the same requestId for retries/double taps: it only spends once. */
export async function redeemReward(slug: string, profile: User, rewardId: string, requestId?: string | null): Promise<Result<{ redemption: RedemptionView; balance: number }>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail(NOT_FOUND)
    if (!UUID.test(rewardId)) return fail('Reward not found.')
    if (requestId && !UUID.test(requestId)) return fail('Invalid request id.')
    if (!(await loadParticipant(c.id, profile.id))) return fail('Join the competition first.')
    const db = createServiceClient()
    // The reward must belong to this competition (the DB function checks the rest).
    const { data: reward, error: rErr } = await db.from('competition_rewards').select(REWARD_COLUMNS).eq('id', rewardId).eq('competition_id', c.id).maybeSingle()
    if (rErr) return fail(missingTable(rErr) ? OFF : 'Could not redeem. Please try again.')
    if (!reward) return fail('Reward not found.')

    const { data, error } = await db.rpc('_unsafe_redeem_reward', { p_user_id: profile.id, p_reward_id: rewardId, p_request_id: requestId ?? null })
    if (error)
    {
        if (missingTable(error)) return fail(OFF)
        const code = Object.keys(REDEEM_ERRORS).find((k) => error.message?.includes(k))
        return fail(code ? REDEEM_ERRORS[code] : 'Could not redeem. Please try again.')
    }
    const res = data as { redemption_id: string; balance: number }
    const { data: row } = await db.from('competition_redemptions').select(REDEMPTION_COLUMNS).eq('id', res.redemption_id).single()
    return { ok: true, redemption: toRedemption(row as RedemptionRow, reward as RewardRow), balance: Number(res.balance) }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminReward extends Omit<RewardView, 'redeemedByMe' | 'blocked'>
{
    isActive: boolean
    sort: number
    /** Redemptions that aren't cancelled. */
    redeemed: number
    pending: number
}

export interface RewardInput
{
    title: string
    description?: string | null
    imageUrl?: string | null
    costTokens: number
    stock?: number | null
    perUserLimit?: number | null
    kind: RewardKind
    fulfilment: 'auto' | 'manual'
    isActive?: boolean
    sort?: number
}

export interface AdminRedemption extends RedemptionView
{
    user: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null }
    fulfilledBy: string | null
}

async function adminComp(slug: string, profile: User): Promise<Result<{ comp: { id: string; slug: string } }>>
{
    if (!isAdmin(profile)) return fail('Unauthorized')
    const { data } = await createServiceClient().from('competitions').select('id, slug, format').eq('slug', slug).maybeSingle()
    if (!data || data.format !== 'world') return fail(NOT_FOUND)
    return { ok: true, comp: { id: data.id, slug: data.slug } }
}

export async function adminListRewards(slug: string, profile: User): Promise<Result<{ enabled: boolean; rewards: AdminReward[] }>>
{
    const a = await adminComp(slug, profile)
    if (!a.ok) return a
    const db = createServiceClient()
    const [{ data, error }, { data: reds }] = await Promise.all([
        db.from('competition_rewards').select(REWARD_COLUMNS).eq('competition_id', a.comp.id).order('sort').order('created_at'),
        db.from('competition_redemptions').select('reward_id, status').eq('competition_id', a.comp.id).neq('status', 'cancelled').limit(100000),
    ])
    if (error) return missingTable(error) ? { ok: true, enabled: false, rewards: [] } : fail('Could not load rewards.')
    const counts: Record<string, { redeemed: number; pending: number }> = {}
    for (const r of (reds ?? []) as { reward_id: string; status: RedemptionStatus }[])
    {
        const x = counts[r.reward_id] ??= { redeemed: 0, pending: 0 }
        x.redeemed++; if (r.status === 'pending') x.pending++
    }
    return {
        ok: true, enabled: true,
        rewards: ((data ?? []) as RewardRow[]).map((r) => ({
            id: r.id, title: r.title, description: r.description, imageUrl: r.image_url, costTokens: r.cost_tokens, kind: r.kind,
            fulfilment: r.fulfilment, stock: r.stock, perUserLimit: r.per_user_limit, isActive: r.is_active, sort: r.sort,
            redeemed: counts[r.id]?.redeemed ?? 0, pending: counts[r.id]?.pending ?? 0,
        })),
    }
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

function checkReward(r: Partial<RewardInput>): string | null
{
    if (typeof r.title !== 'string' || r.title.trim().length < 2 || r.title.length > 120) return 'Add a title (2–120 characters).'
    if (r.description != null && (typeof r.description !== 'string' || r.description.length > 1000)) return 'The description is too long (1,000 characters max).'
    if (r.imageUrl != null && r.imageUrl !== '' && (typeof r.imageUrl !== 'string' || !/^https:\/\/\S+$/.test(r.imageUrl) || r.imageUrl.length > 500)) return 'The image must be an https:// link.'
    if (!isInt(r.costTokens, 1, 100000)) return `Cost must be 1–100,000 ${TOKENS_LABEL}.`
    if (r.stock != null && !isInt(r.stock, 0, 1000000)) return 'Stock must be a whole number (leave empty for unlimited).'
    if (r.perUserLimit != null && !isInt(r.perUserLimit, 1, 1000)) return 'The per-student limit must be 1 or more (leave empty for no limit).'
    if (!REWARD_KINDS.includes(r.kind as RewardKind)) return 'Choose a reward type.'
    if (r.fulfilment !== 'auto' && r.fulfilment !== 'manual') return 'Choose how it is delivered (auto or manual).'
    if (r.sort != null && !isInt(r.sort, -1000, 1000)) return 'Sort must be a whole number.'
    return null
}

function rewardRow(r: RewardInput)
{
    return {
        title: r.title.trim(), description: r.description?.trim() || null, image_url: r.imageUrl?.trim() || null, cost_tokens: r.costTokens,
        stock: r.stock ?? null, per_user_limit: r.perUserLimit ?? null, kind: r.kind, fulfilment: r.fulfilment,
        is_active: r.isActive ?? false, sort: r.sort ?? 0, updated_at: new Date().toISOString(),
    }
}

/** Create (id null) or update a reward. New rewards start switched off unless isActive is true. */
export async function saveReward(slug: string, profile: User, id: string | null, input: Partial<RewardInput>): Promise<Result<{ id: string }>>
{
    const a = await adminComp(slug, profile)
    if (!a.ok) return a
    const db = createServiceClient()
    let merged = input as RewardInput
    if (id)
    {
        if (!UUID.test(id)) return fail('Reward not found.')
        const { data: cur, error } = await db.from('competition_rewards').select(REWARD_COLUMNS).eq('id', id).eq('competition_id', a.comp.id).maybeSingle()
        if (error) return fail(missingTable(error) ? OFF : 'Could not load the reward.')
        if (!cur) return fail('Reward not found.')
        const c = cur as RewardRow
        merged = {
            title: c.title, description: c.description, imageUrl: c.image_url, costTokens: c.cost_tokens, stock: c.stock, perUserLimit: c.per_user_limit,
            kind: c.kind, fulfilment: c.fulfilment, isActive: c.is_active, sort: c.sort, ...input,
        }
    }
    const bad = checkReward(merged)
    if (bad) return fail(bad)
    if (id)
    {
        const { error } = await db.from('competition_rewards').update(rewardRow(merged)).eq('id', id).eq('competition_id', a.comp.id)
        return error ? fail('Could not save the reward.') : { ok: true, id }
    }
    const { data, error } = await db.from('competition_rewards').insert({ ...rewardRow(merged), competition_id: a.comp.id }).select('id').single()
    if (error || !data) return fail(missingTable(error) ? OFF : 'Could not save the reward.')
    return { ok: true, id: data.id }
}

export async function adminListRedemptions(slug: string, profile: User, opts: { status?: string; limit?: number } = {}): Promise<Result<{ enabled: boolean; redemptions: AdminRedemption[]; counts: Record<RedemptionStatus, number> }>>
{
    const a = await adminComp(slug, profile)
    if (!a.ok) return a
    const db = createServiceClient()
    let q = db.from('competition_redemptions').select(REDEMPTION_COLUMNS).eq('competition_id', a.comp.id)
    if (opts.status === 'pending' || opts.status === 'fulfilled' || opts.status === 'cancelled') q = q.eq('status', opts.status)
    const head = (s: RedemptionStatus) => db.from('competition_redemptions').select('id', { count: 'exact', head: true }).eq('competition_id', a.comp.id).eq('status', s)
    const [{ data, error }, p, f, cx] = await Promise.all([
        q.order('created_at', { ascending: opts.status === 'pending' }).limit(Math.min(opts.limit ?? 100, 200)),
        head('pending'), head('fulfilled'), head('cancelled'),
    ])
    const counts = { pending: p.count ?? 0, fulfilled: f.count ?? 0, cancelled: cx.count ?? 0 }
    if (error) return missingTable(error) ? { ok: true, enabled: false, redemptions: [], counts } : fail('Could not load redemptions.')
    const rows = (data ?? []) as RedemptionRow[]
    const [rewards, { data: users }] = await Promise.all([
        rewardsById(rows.map((r) => r.reward_id)),
        rows.length ? db.from('users').select('id, username, display_name, avatar_url').in('id', [...new Set(rows.map((r) => r.user_id))]) : Promise.resolve({ data: [] }),
    ])
    const uu = new Map(((users ?? []) as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]).map((u) => [u.id, u]))
    return {
        ok: true, enabled: true, counts,
        redemptions: rows.map((r) =>
        {
            const u = uu.get(r.user_id)
            return {
                ...toRedemption(r, rewards.get(r.reward_id)), fulfilledBy: r.fulfilled_by,
                user: { id: r.user_id, username: u?.username ?? null, displayName: u?.display_name ?? null, avatarUrl: u?.avatar_url ?? null },
            }
        }),
    }
}

const rewardsUrl = (slug: string) => `/app/competitions/${slug}/rewards`

/** Mark a pending redemption delivered, with an optional code / note for the student. */
export async function fulfilRedemption(slug: string, profile: User, id: string, input: { code?: string | null; note?: string | null }): Promise<Result>
{
    const a = await adminComp(slug, profile)
    if (!a.ok) return a
    if (!UUID.test(id)) return fail('Redemption not found.')
    const code = input.code?.trim().slice(0, 80) || null
    const note = input.note?.trim().slice(0, 1000) || null
    const db = createServiceClient()
    const { data, error } = await db.from('competition_redemptions')
        .update({ status: 'fulfilled', code, note, fulfilled_by: profile.id, fulfilled_at: new Date().toISOString() })
        .eq('id', id).eq('competition_id', a.comp.id).eq('status', 'pending')
        .select('user_id, reward_id').maybeSingle()
    if (error) return fail(missingTable(error) ? OFF : 'Could not update the redemption.')
    if (!data) return fail('This redemption is no longer pending.')
    const reward = (await rewardsById([data.reward_id])).get(data.reward_id)
    await notifyWorld([{
        userId: data.user_id, actorId: profile.id, referenceId: id, referenceType: 'world_reward', url: rewardsUrl(a.comp.slug),
        title: `Your reward is ready: ${reward?.title ?? 'reward'}`,
        body: code ? `Your code is ${code}.${note ? ` ${note}` : ''}` : note ?? 'Open the Rewards Exchange to see the details.',
    }])
    return { ok: true }
}

/** Cancel a redemption and give the tokens back (a positive 'reversal' row). */
export async function cancelRedemption(slug: string, profile: User, id: string, note?: string | null): Promise<Result<{ refunded: number }>>
{
    const a = await adminComp(slug, profile)
    if (!a.ok) return a
    if (!UUID.test(id)) return fail('Redemption not found.')
    const db = createServiceClient()
    const { data: row, error: rowErr } = await db.from('competition_redemptions').select('id, reward_id').eq('id', id).eq('competition_id', a.comp.id).maybeSingle()
    if (rowErr) return fail(missingTable(rowErr) ? OFF : 'Could not load the redemption.')
    if (!row) return fail('Redemption not found.')
    const { data, error } = await db.rpc('_unsafe_cancel_redemption', { p_redemption_id: id, p_admin_id: profile.id, p_note: note?.trim().slice(0, 1000) || null })
    if (error)
    {
        if (/already_cancelled/.test(error.message ?? '')) return fail('This redemption was already cancelled.')
        return fail(missingTable(error) ? OFF : 'Could not cancel the redemption.')
    }
    const res = data as { user_id: string; refunded: number }
    const reward = (await rewardsById([row.reward_id])).get(row.reward_id)
    await notifyWorld([{
        userId: res.user_id, actorId: profile.id, referenceId: id, referenceType: 'world_reward', url: rewardsUrl(a.comp.slug),
        title: `Redemption cancelled: ${reward?.title ?? 'reward'}`,
        body: `${res.refunded} ${TOKENS_LABEL} are back in your balance.${note?.trim() ? ` ${note.trim()}` : ''}`,
    }])
    return { ok: true, refunded: Number(res.refunded) }
}
