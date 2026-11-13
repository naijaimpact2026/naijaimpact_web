import { randomInt } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import type { User } from '@/lib/types'
import { buildMissionViews, loadParticipant, playableWorld, type Result } from './service'
import { stageFinale, stageScores } from './progress'
import { notifyWorld } from './notify'
import { STAGE_NAMES, STAGE_WEEKS, type CertificateView, type MyCertificatesView, type Pathway } from './types'

/*
 * Stage certificates. A player who passes a stage (score 60+ and the stage
 * finale passed — see progress.ts) gets one certificate per stage, issued
 * lazily when they open their certificates or when a judge passes the
 * finale. Holder name/campus are snapshots. Verification is public at
 * CERT_BASE_URL/certificates/<code> and always points at production.
 */

export const CERT_BASE_URL = (process.env.CERTIFICATE_BASE_URL || 'https://hubnovo.com').replace(/\/+$/, '')
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
export const formatCertCode = (code: string) => code.match(/.{1,4}/g)!.join('-')
export const normalizeCertCode = (raw: string) => String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const missingTable = (e: { code?: string; message?: string } | null) => Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message ?? '')))

interface CertRow
{
    code: string; competition_id: string; user_id: string; stage: number; pathway: Pathway; score: number
    holder_name: string; institution_name: string | null; issued_at: string; revoked_at: string | null
}
const CERT_COLUMNS = 'code, competition_id, user_id, stage, pathway, score, holder_name, institution_name, issued_at, revoked_at'

export const stageName = (pathway: Pathway, stage: number) => STAGE_NAMES[pathway]?.[stage] ?? `Stage ${stage}`

function toView(r: CertRow, competitionName: string, pathwayName: string): CertificateView
{
    const base = `${CERT_BASE_URL}/certificates/${formatCertCode(r.code)}`
    return {
        code: r.code, verifyUrl: base, imageUrl: `${CERT_BASE_URL}/api/certificates/${r.code}/image`, pdfUrl: `${CERT_BASE_URL}/api/certificates/${r.code}/pdf`,
        competitionName, stage: r.stage, stageName: stageName(r.pathway, r.stage), pathway: r.pathway, pathwayName,
        holderName: r.holder_name, institution: r.institution_name, score: r.score, issuedAt: r.issued_at, revoked: Boolean(r.revoked_at),
    }
}

async function names(competitionId: string)
{
    const db = createServiceClient()
    const [{ data: comp }, { data: paths }] = await Promise.all([
        db.from('competitions').select('name, slug').eq('id', competitionId).maybeSingle(),
        db.from('competition_pathways').select('key, name').eq('competition_id', competitionId),
    ])
    const pathways = new Map(((paths ?? []) as { key: string; name: string }[]).map((p) => [p.key, p.name]))
    return { competition: (comp as { name: string; slug: string } | null) ?? { name: 'Hubnovo World', slug: 'campus' }, pathways }
}

/**
 * Issues any certificates the player has earned and doesn't have yet.
 * Returns the newly issued ones (empty if none, or if certificates are off).
 */
export async function ensureCertificates(c: { id: string; slug: string; season_start: string | null }, userId: string): Promise<{ issued: CertRow[]; enabled: boolean }>
{
    const db = createServiceClient()
    const me = await loadParticipant(c.id, userId)
    if (!me) return { issued: [], enabled: true }
    const { missions, attempts } = await buildMissionViews(c.id, c.season_start, me.pathway, userId)
    const passed = stageScores(missions, attempts).filter((s) => s.passed)
    const { data: have, error } = await db.from('competition_certificates').select('stage').eq('competition_id', c.id).eq('user_id', userId)
    if (error) return { issued: [], enabled: !missingTable(error) }
    const owned = new Set(((have ?? []) as { stage: number }[]).map((r) => r.stage))
    const todo = passed.filter((s) => !owned.has(s.stage))
    if (todo.length === 0) return { issued: [], enabled: true }

    const { data: u } = await db.from('users').select('display_name, username').eq('id', userId).maybeSingle()
    const holder = (u as { display_name: string | null; username: string | null } | null)
    const holderName = (holder?.display_name || holder?.username || 'Hubnovo player').trim().slice(0, 80)
    const institution = me.institution ? me.institution.name : null

    const issued: CertRow[] = []
    for (const s of todo)
    {
        for (let i = 0; i < 4; i++)
        {
            const { data, error: insErr } = await db.from('competition_certificates').upsert({
                code: newCode(), competition_id: c.id, user_id: userId, stage: s.stage, pathway: me.pathway,
                score: s.total, holder_name: holderName, institution_name: institution,
            }, { onConflict: 'competition_id,user_id,stage', ignoreDuplicates: true }).select(CERT_COLUMNS)
            if (!insErr) { if (data?.length) issued.push(data[0] as CertRow); break }
            if (insErr.code !== '23505') { console.error('certificate issue failed:', insErr.message); break }
        }
    }
    if (issued.length)
        await notifyWorld(issued.map((r) => ({
            userId, referenceId: c.id, referenceType: 'world_certificate' as const,
            title: `Your Stage ${r.stage} certificate is ready`,
            body: `You passed ${stageName(r.pathway, r.stage)} with ${r.score}/100. Download it and share it.`,
            url: `/app/competitions/${c.slug}/certificates`,
        })))
    return { issued, enabled: true }
}

/** The caller's certificates (issuing any newly earned ones first) and their next stage. */
export async function myCertificates(slug: string, profile: User): Promise<Result<MyCertificatesView>>
{
    const c = await playableWorld(slug, profile)
    if (!c) return fail('Competition not found.')
    const me = await loadParticipant(c.id, profile.id)
    if (!me) return fail('Join the competition first.')
    const { enabled } = await ensureCertificates(c, profile.id)
    if (!enabled) return { ok: true, enabled: false, certificates: [], next: null }

    const db = createServiceClient()
    const [{ data }, n, { missions, attempts }] = await Promise.all([
        db.from('competition_certificates').select(CERT_COLUMNS).eq('competition_id', c.id).eq('user_id', profile.id).order('stage'),
        names(c.id),
        buildMissionViews(c.id, c.season_start, me.pathway, profile.id),
    ])
    const rows = (data ?? []) as CertRow[]
    const certificates = rows.map((r) => toView(r, n.competition.name, n.pathways.get(r.pathway) ?? r.pathway))
    const owned = new Set(rows.map((r) => r.stage))
    const stage = stageScores(missions, attempts).find((s) => !owned.has(s.stage)) ?? null
    const finale = stage ? stageFinale(missions.filter((m) => m.stage === stage.stage)) : null
    return {
        ok: true, enabled: true, certificates,
        next: stage ? {
            stage: stage.stage, stageName: stageName(me.pathway, stage.stage), total: stage.total, passMark: stage.passMark,
            finalePassed: stage.finalePassed, finaleWeek: finale?.week ?? stage.stage * STAGE_WEEKS,
        } : null,
    }
}

/** Public lookup for the verification page and the image/PDF routes. */
export async function getCertificate(rawCode: string): Promise<CertificateView | null>
{
    const code = normalizeCertCode(rawCode)
    if (!/^[A-Z2-9]{12}$/.test(code)) return null
    const { data, error } = await createServiceClient().from('competition_certificates').select(CERT_COLUMNS).eq('code', code).maybeSingle()
    if (error || !data) return null
    const r = data as CertRow
    const n = await names(r.competition_id)
    return toView(r, n.competition.name, n.pathways.get(r.pathway) ?? r.pathway)
}
