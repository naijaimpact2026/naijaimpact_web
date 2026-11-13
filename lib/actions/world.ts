'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getActingProfile } from '@/lib/modushive/acting-profile'
import * as world from '@/lib/world/service'
import * as squads from '@/lib/world/squads'
import * as content from '@/lib/world/admin-content'
import type { AttemptPayload, Pathway, RubricView } from '@/lib/world/types'
import * as rewards from '@/lib/world/rewards'
import * as reports from '@/lib/world/reports'

/*
 * Web server actions for Hubnovo World. Thin wrappers: every check lives in
 * lib/world/service.ts, which the mobile REST API (app/api/competitions)
 * calls too. Only self-authenticating wrappers are exported from this file
 * (each export here is a public endpoint).
 */

async function me()
{
    const acting = getActingProfile()
    if (acting) return acting
    const { profile } = await getCurrentUser()
    return profile
}

const unauthorized = { ok: false as const, error: 'Please sign in again.' }
const refresh = (slug: string) => revalidatePath(`/app/competitions/${slug}`)

export async function searchInstitutionsAction(q: string)
{
    const p = await me(); if (!p) return unauthorized
    return { ok: true as const, institutions: await world.searchInstitutions(String(q ?? '')) }
}

export async function joinWorldAction(slug: string, input: world.JoinInput)
{
    const p = await me(); if (!p) return unauthorized
    const r = await world.joinWorld(slug, p, input)
    if (r.ok) refresh(slug)
    return r
}

export async function updateWorldMeAction(slug: string, input: Partial<world.JoinInput>)
{
    const p = await me(); if (!p) return unauthorized
    const r = await world.updateWorldMe(slug, p, input)
    if (r.ok) refresh(slug)
    return r
}

export async function worldUploadUrlAction(slug: string, missionId: string, input: { fieldId: string; contentType: string; sizeBytes: number })
{
    const p = await me(); if (!p) return unauthorized
    return world.createUploadUrl(slug, missionId, p, input)
}

export async function submitWorldAttemptAction(slug: string, missionId: string, payload: AttemptPayload)
{
    const p = await me(); if (!p) return unauthorized
    const r = await world.submitAttempt(slug, missionId, p, payload)
    if (r.ok) refresh(slug)
    return r
}

export async function appealWorldAttemptAction(slug: string, attemptId: string, reason: string)
{
    const p = await me(); if (!p) return unauthorized
    return world.appealAttempt(slug, attemptId, p, reason)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function reviewWorldAttemptAction(input: world.ReviewInput)
{
    const p = await me(); if (!p) return unauthorized
    const r = await world.reviewAttempt(p, input)
    if (r.ok) revalidatePath('/app/competitions/judging')
    return r
}

// ─── Admin: content editor ───────────────────────────────────────────────────

const refreshContent = (slug: string) => { revalidatePath(`/app/competitions/${slug}/admin/content`); refresh(slug) }

export async function listAdminMissionsAction(slug: string, filters: content.MissionFilters = {})
{
    const p = await me(); if (!p) return unauthorized
    return content.listAdminMissions(slug, p, filters)
}

export async function saveMissionAction(slug: string, id: string | null, input: content.MissionInput)
{
    const p = await me(); if (!p) return unauthorized
    const r = id ? await content.updateMission(slug, p, id, input) : await content.createMission(slug, p, input)
    if (r.ok) refreshContent(slug)
    return r
}

export async function setMissionActiveAction(slug: string, id: string, isActive: boolean)
{
    const p = await me(); if (!p) return unauthorized
    const r = await content.updateMission(slug, p, id, { isActive })
    if (r.ok) refreshContent(slug)
    return r
}

export async function duplicateMissionsAction(slug: string, input: { missionId?: string; pathway?: Pathway; fromWeek?: number; toWeek: number; toPathway?: Pathway; toDay?: number })
{
    const p = await me(); if (!p) return unauthorized
    const r = await content.duplicateMissions(slug, p, input)
    if (r.ok) refreshContent(slug)
    return r
}

export async function importWeekAction(slug: string, input: { missions: content.MissionInput[]; replace?: boolean; activate?: boolean })
{
    const p = await me(); if (!p) return unauthorized
    const r = await content.importWeek(slug, p, input)
    if (r.ok) refreshContent(slug)
    return r
}

export async function saveRubricAction(slug: string, input: RubricView)
{
    const p = await me(); if (!p) return unauthorized
    const r = await content.saveRubric(slug, p, input)
    if (r.ok) refreshContent(slug)
    return r
}

// ─── Rewards Exchange ────────────────────────────────────────────────────────

const refreshRewards = (slug: string) => { revalidatePath(`/app/competitions/${slug}/rewards`); revalidatePath(`/app/competitions/${slug}/admin/rewards`); refresh(slug) }

export async function redeemRewardAction(slug: string, rewardId: string, requestId: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await rewards.redeemReward(slug, p, rewardId, requestId)
    if (r.ok) refreshRewards(slug)
    return r
}

export async function saveRewardAction(slug: string, id: string | null, input: Partial<rewards.RewardInput>)
{
    const p = await me(); if (!p) return unauthorized
    const r = await rewards.saveReward(slug, p, id, input)
    if (r.ok) refreshRewards(slug)
    return r
}

export async function fulfilRedemptionAction(slug: string, id: string, input: { code?: string | null; note?: string | null })
{
    const p = await me(); if (!p) return unauthorized
    const r = await rewards.fulfilRedemption(slug, p, id, input)
    if (r.ok) refreshRewards(slug)
    return r
}

export async function cancelRedemptionAction(slug: string, id: string, note?: string | null)
{
    const p = await me(); if (!p) return unauthorized
    const r = await rewards.cancelRedemption(slug, p, id, note)
    if (r.ok) refreshRewards(slug)
    return r
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function reportPlayerAction(slug: string, input: reports.ReportInput)
{
    const p = await me(); if (!p) return unauthorized
    return reports.reportPlayer(slug, p, input)
}

export async function handleReportAction(input: reports.HandleReportInput)
{
    const p = await me(); if (!p) return unauthorized
    const r = await reports.handleReport(p, input)
    if (r.ok) revalidatePath('/app/competitions/judging')
    return r
}

// ─── Squads ──────────────────────────────────────────────────────────────────

const refreshSquad = (slug: string) => { revalidatePath(`/app/competitions/${slug}/squad`); refresh(slug) }

export async function createSquadAction(slug: string, name: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await squads.createSquad(slug, p, { name })
    if (r.ok) refreshSquad(slug)
    return r
}

export async function joinSquadAction(slug: string, code: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await squads.joinSquad(slug, p, { code })
    if (r.ok) refreshSquad(slug)
    return r
}

export async function leaveSquadAction(slug: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await squads.leaveSquad(slug, p)
    if (r.ok) refreshSquad(slug)
    return r
}

export async function removeSquadMemberAction(slug: string, userId: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await squads.removeSquadMember(slug, p, userId)
    if (r.ok) refreshSquad(slug)
    return r
}

export async function renameSquadAction(slug: string, name: string)
{
    const p = await me(); if (!p) return unauthorized
    const r = await squads.renameSquad(slug, p, { name })
    if (r.ok) refreshSquad(slug)
    return r
}

export async function openSquadChatAction(slug: string)
{
    const p = await me(); if (!p) return unauthorized
    return squads.openSquadChat(slug, p)
}
