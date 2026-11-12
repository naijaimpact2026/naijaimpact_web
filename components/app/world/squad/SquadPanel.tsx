'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Copy, Crown, Loader2, LogOut, MessageCircle, Pencil, Share2, ShieldCheck, UserMinus, UserPlus, Users, X, Zap } from 'lucide-react'
import { toast } from '@/components/toast'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { characterPreviewUrl } from '@/lib/competitions/config'
import { createSquadAction, joinSquadAction, leaveSquadAction, openSquadChatAction, removeSquadMemberAction, renameSquadAction } from '@/lib/actions/world'
import { SQUAD_MAX, SQUAD_MIN, XP_LABEL, type SquadMemberView, type SquadView } from '@/lib/world/types'
import { STATUS_META, formatUnlock } from '@/lib/world/ui'
import { AnimatedBar } from '../fx'

type PathwayLite = { key: string; name: string; color: string }

export default function SquadPanel({ slug, enabled, squad, pathway, inviteCode }: {
    slug: string; enabled: boolean; squad: SquadView | null; pathway: PathwayLite; inviteCode: string | null
})
{
    if (!enabled)
        return (
            <section className="hw-rise rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Users className="mx-auto h-9 w-9 text-muted-foreground" />
                <h1 className="mt-3 text-lg font-bold text-foreground">Squads are switching on soon</h1>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">You’ll be able to team up with 2–4 classmates for the Friday team missions.</p>
            </section>
        )
    return squad ? <MySquad slug={slug} squad={squad} color={pathway.color} /> : <NoSquad slug={slug} pathway={pathway} inviteCode={inviteCode} />
}

// ─── No squad yet: create or join ────────────────────────────────────────────

function NoSquad({ slug, pathway, inviteCode }: { slug: string; pathway: PathwayLite; inviteCode: string | null })
{
    const router = useRouter()
    const [name, setName] = useState('')
    const [code, setCode] = useState((inviteCode ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
    const [busy, setBusy] = useState<'create' | 'join' | null>(null)

    async function create()
    {
        setBusy('create')
        const r = await createSquadAction(slug, name)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        toast.success(`Squad “${r.squad.name}” created. Share your code!`)
    }
    async function join()
    {
        setBusy('join')
        const r = await joinSquadAction(slug, code)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        toast.success(`You joined ${r.squad.name} 🎉`)
        router.replace(`/app/competitions/${slug}/squad`)
    }

    return (
        <div className="space-y-4">
            <section className="hw-rise relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6" style={{ background: `linear-gradient(135deg, ${pathway.color} 0%, #102A43 90%)` }}>
                <Users className="hw-float absolute -right-4 -top-4 h-32 w-32 text-white/10" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{pathway.name}</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">Build your squad</h1>
                <p className="mt-1 max-w-lg text-sm text-white/85">
                    Team up with {SQUAD_MIN - 1}–{SQUAD_MAX - 1} classmates in your pathway. Squads do the Friday team missions together and get their own group chat.
                </p>
                <ul className="mt-3 grid gap-1.5 text-xs text-white/85 sm:grid-cols-3">
                    <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {SQUAD_MIN}–{SQUAD_MAX} players</li>
                    <li className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Squad chat</li>
                    <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Join by invite code only</li>
                </ul>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
                <section className={`hw-rise rounded-3xl border bg-card p-5 ${code.length === 6 ? 'border-border' : 'border-border'}`} style={{ animationDelay: '60ms' }}>
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><UserPlus className="h-5 w-5" style={{ color: pathway.color }} /> Join with a code</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Got a code from a classmate? Enter it here.</p>
                    <label className="sr-only" htmlFor="squad-code">Squad code</label>
                    <input
                        id="squad-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && join()}
                        placeholder="ABC234"
                        autoCapitalize="characters"
                        autoComplete="off"
                        inputMode="text"
                        className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2"
                        style={{ ['--tw-ring-color' as string]: pathway.color }}
                    />
                    <button
                        type="button" onClick={join} disabled={code.length !== 6 || Boolean(busy)}
                        className="hw-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: pathway.color }}
                    >
                        {busy === 'join' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Join squad
                    </button>
                </section>

                <section className="hw-rise rounded-3xl border border-border bg-card p-5" style={{ animationDelay: '120ms' }}>
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Crown className="h-5 w-5 text-amber-500" /> Start a squad</h2>
                    <p className="mt-1 text-sm text-muted-foreground">You’ll lead it and get a code to share.</p>
                    <label className="sr-only" htmlFor="squad-name">Squad name</label>
                    <input
                        id="squad-name"
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 40))}
                        onKeyDown={(e) => e.key === 'Enter' && name.trim().length >= 2 && create()}
                        placeholder="e.g. Lagoon Builders"
                        className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">{name.length}/40</p>
                    <button
                        type="button" onClick={create} disabled={name.trim().length < 2 || Boolean(busy)}
                        className="hw-press mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
                    >
                        {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Create squad
                    </button>
                </section>
            </div>
            <p className="text-center text-xs text-muted-foreground">Only share your squad code with classmates you know. You can leave a squad at any time.</p>
        </div>
    )
}

// ─── In a squad ──────────────────────────────────────────────────────────────

function MySquad({ slug, squad, color }: { slug: string; squad: SquadView; color: string })
{
    const router = useRouter()
    const me = squad.members.find((m) => m.isMe)
    const iLead = Boolean(me?.isLeader)
    const needed = Math.max(0, squad.min - squad.members.length)
    const [copied, setCopied] = useState(false)
    const [busy, setBusy] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<{ kind: 'leave' } | { kind: 'remove'; member: SquadMemberView } | null>(null)
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(squad.name)
    const teamDone = squad.members.filter((m) => m.teamMission === 'passed').length

    const inviteUrl = () => `${window.location.origin}/app/competitions/${slug}/squad?code=${squad.code}`
    async function copy()
    {
        try { await navigator.clipboard.writeText(squad.code); setCopied(true); setTimeout(() => setCopied(false), 1800) }
        catch { toast.error('Could not copy. Long-press the code instead.') }
    }
    async function share()
    {
        const text = `Join my squad “${squad.name}” on the Hubnovo Campus Competition. Code: ${squad.code}`
        if (navigator.share) { try { await navigator.share({ title: 'Join my squad', text, url: inviteUrl() }) } catch { /* cancelled */ } }
        else { try { await navigator.clipboard.writeText(`${text}\n${inviteUrl()}`); toast.success('Invite link copied') } catch { toast.error('Could not copy the link.') } }
    }
    async function openChat()
    {
        setBusy('chat')
        const r = await openSquadChatAction(slug)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        router.push(`/app/chat/${r.chatChannelId}`)
    }
    async function leave()
    {
        setBusy('leave')
        const r = await leaveSquadAction(slug)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        setConfirm(null)
        toast.success(`You left ${squad.name}`)
    }
    async function remove(m: SquadMemberView)
    {
        setBusy(`rm:${m.userId}`)
        const r = await removeSquadMemberAction(slug, m.userId)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        setConfirm(null)
        toast.success(`${m.displayName ?? m.username ?? 'Player'} was removed`)
    }
    async function rename()
    {
        if (name.trim() === squad.name) { setEditing(false); return }
        setBusy('rename')
        const r = await renameSquadAction(slug, name)
        setBusy(null)
        if (!r.ok) { toast.error(r.error); return }
        setEditing(false)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <section className="hw-rise relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6" style={{ background: `linear-gradient(135deg, ${color} 0%, #102A43 90%)` }}>
                <Users className="hw-float absolute -right-4 -top-4 h-32 w-32 text-white/10" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">Your squad</p>
                {editing ? (
                    <div className="mt-1 flex items-center gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} onKeyDown={(e) => e.key === 'Enter' && rename()} autoFocus aria-label="Squad name"
                            className="min-w-0 flex-1 rounded-xl bg-white/15 px-3 py-1.5 text-xl font-extrabold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/60" />
                        <button type="button" onClick={rename} disabled={busy === 'rename'} className="hw-press rounded-xl bg-white/20 p-2 hover:bg-white/30" aria-label="Save name">{busy === 'rename' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                        <button type="button" onClick={() => { setEditing(false); setName(squad.name) }} className="hw-press rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Cancel"><X className="h-4 w-4" /></button>
                    </div>
                ) : (
                    <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
                        <span className="truncate">{squad.name}</span>
                        {iLead && <button type="button" onClick={() => setEditing(true)} className="hw-press rounded-lg p-1 text-white/70 hover:bg-white/15 hover:text-white" aria-label="Rename squad"><Pencil className="h-4 w-4" /></button>}
                    </h1>
                )}
                <div className="mt-3 max-w-sm">
                    <div className="flex justify-between text-xs font-semibold text-white/85"><span>{squad.members.length}/{squad.max} players</span><span>{needed > 0 ? `Needs ${needed} more` : 'Ready for team missions ✓'}</span></div>
                    <AnimatedBar pct={(squad.members.length / squad.max) * 100} color="#ffffff" track="bg-white/20" className="mt-1 h-2" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
                    <div className="rounded-2xl bg-black/20 px-3 py-2"><p className="text-lg font-extrabold tabular-nums">{squad.weekXp.toLocaleString('en-NG')}</p><p className="text-[11px] text-white/75">{XP_LABEL} this week</p></div>
                    <div className="rounded-2xl bg-black/20 px-3 py-2"><p className="text-lg font-extrabold tabular-nums">{squad.totalXp.toLocaleString('en-NG')}</p><p className="text-[11px] text-white/75">{XP_LABEL} all time</p></div>
                </div>
            </section>

            {/* Actions */}
            <div className="hw-rise grid gap-3 sm:grid-cols-2" style={{ animationDelay: '60ms' }}>
                <section className="rounded-3xl border border-border bg-card p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Invite code</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="flex-1 select-all rounded-2xl bg-muted px-3 py-2 text-center font-mono text-2xl font-extrabold tracking-[0.35em] text-foreground">{squad.code}</span>
                        <button type="button" onClick={copy} className="hw-press rounded-2xl border border-border p-3 hover:bg-muted" aria-label="Copy code">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
                        <button type="button" onClick={share} className="hw-press rounded-2xl p-3 text-white" style={{ backgroundColor: color }} aria-label="Share invite"><Share2 className="h-4 w-4" /></button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{squad.members.length >= squad.max ? 'Your squad is full.' : 'Share it only with classmates you know.'}</p>
                </section>
                <button type="button" onClick={openChat} disabled={busy === 'chat'} className="hw-lift hw-press flex items-center gap-3 rounded-3xl border border-border bg-card p-4 text-left hover:bg-muted/40">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: color }}>{busy === 'chat' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}</span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold text-foreground">Squad chat</span>
                        <span className="block text-xs text-muted-foreground">Plan team missions together. Keep it kind; no personal contact details.</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* This week's team mission */}
            {squad.teamMission && (
                <Link href={`/app/competitions/${slug}/missions/${squad.teamMission.id}`} className="hw-rise hw-lift block rounded-3xl border border-border bg-card p-4 hover:bg-muted/40" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}1f`, color }}><Users className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Week {squad.teamMission.week} team mission · {new Date(squad.teamMission.unlocksAt) > new Date() ? `opens ${formatUnlock(squad.teamMission.unlocksAt)}` : 'open now'}</p>
                            <p className="truncate text-sm font-bold text-foreground">{squad.teamMission.title}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-foreground">{teamDone}/{squad.members.length} done</span>
                    </div>
                </Link>
            )}

            {/* Members */}
            <section className="hw-rise overflow-hidden rounded-3xl border border-border bg-card" style={{ animationDelay: '140ms' }}>
                <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">Members</h2>
                <ul>
                    {squad.members.map((m, n) => {
                        const name = m.displayName ?? m.username ?? 'Player'
                        const st = m.teamMission ? STATUS_META[m.teamMission] : null
                        return (
                            <li key={m.userId} className={`hw-rise flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${m.isMe ? 'bg-primary/5' : ''}`} style={{ animationDelay: `${160 + n * 50}ms` }}>
                                <MemberAvatar m={m} />
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
                                        {name}
                                        {m.isLeader && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"><Crown className="h-2.5 w-2.5" /> Leader</span>}
                                        {m.isMe && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: color }}>You</span>}
                                    </p>
                                    <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-0.5"><Zap className="h-3 w-3 text-amber-500" />{m.weekXp.toLocaleString('en-NG')} this week</span>
                                        <span>{m.xp.toLocaleString('en-NG')} total</span>
                                    </p>
                                </div>
                                {squad.teamMission && (st
                                    ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.tone}`}>{st.label}</span>
                                    : <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Not started</span>)}
                                {iLead && !m.isMe && (
                                    <button type="button" onClick={() => setConfirm({ kind: 'remove', member: m })} disabled={Boolean(busy)} className="hw-press shrink-0 rounded-xl p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600" aria-label={`Remove ${name}`} title="Remove from squad">
                                        {busy === `rm:${m.userId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                                    </button>
                                )}
                            </li>
                        )
                    })}
                    {Array.from({ length: Math.max(0, squad.max - squad.members.length) }).map((_, i) => (
                        <li key={`empty-${i}`} className="flex items-center gap-3 border-b border-dashed border-border px-4 py-3 text-sm text-muted-foreground last:border-b-0">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border"><UserPlus className="h-4 w-4" /></span>
                            Open spot{i < needed ? ' · needed' : ''}
                        </li>
                    ))}
                </ul>
            </section>

            {/* Leave */}
            <div className="flex justify-center">
                <button type="button" onClick={() => setConfirm({ kind: 'leave' })} className="hw-press inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                    <LogOut className="h-4 w-4" /> Leave squad
                </button>
            </div>

            <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open && !busy) setConfirm(null) }}>
                <AlertDialogContent className="rounded-3xl sm:max-w-md">
                    {confirm?.kind === 'leave' ? (
                        <>
                            <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
                                <span className="hw-pop mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600"><LogOut className="h-6 w-6" /></span>
                                <AlertDialogTitle>Leave {squad.name}?</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        {squad.members.length === 1 ? (
                                            <p>You’re the only player, so the squad and its chat will be <span className="font-semibold text-foreground">closed for good</span>.</p>
                                        ) : iLead ? (
                                            <p><span className="font-semibold text-foreground">{nextLeaderName(squad)}</span> becomes the new leader. You’ll be removed from the squad chat.</p>
                                        ) : (
                                            <p>You’ll be removed from the squad chat. You can rejoin later with the code if there’s a spot.</p>
                                        )}
                                        <p className="rounded-xl bg-muted px-3 py-2 text-xs">You keep all your {XP_LABEL}, HubTokens and badges.</p>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2 sm:justify-center">
                                <AlertDialogCancel disabled={busy === 'leave'} className="rounded-2xl">Stay in squad</AlertDialogCancel>
                                <button type="button" onClick={leave} disabled={busy === 'leave'} className="hw-press inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                                    {busy === 'leave' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} {squad.members.length === 1 ? 'Leave and close' : 'Leave squad'}
                                </button>
                            </AlertDialogFooter>
                        </>
                    ) : confirm?.kind === 'remove' ? (
                        <>
                            <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
                                <MemberAvatar m={confirm.member} />
                                <AlertDialogTitle>Remove {confirm.member.displayName ?? confirm.member.username ?? 'this player'}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    They’ll leave {squad.name} and its chat. They keep their own {XP_LABEL} and progress, and can rejoin with the code if you share it again.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2 sm:justify-center">
                                <AlertDialogCancel disabled={Boolean(busy)} className="rounded-2xl">Cancel</AlertDialogCancel>
                                <button type="button" onClick={() => remove(confirm.member)} disabled={Boolean(busy)} className="hw-press inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                                    {busy?.startsWith('rm:') ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />} Remove
                                </button>
                            </AlertDialogFooter>
                        </>
                    ) : null}
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/** Who takes over when the leader leaves: the longest-standing other member. */
function nextLeaderName(squad: SquadView)
{
    const next = squad.members.filter((m) => !m.isMe).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0]
    return next ? next.displayName ?? next.username ?? 'The next member' : 'The next member'
}

function MemberAvatar({ m }: { m: SquadMemberView })
{
    if (m.avatarUrl)
        // eslint-disable-next-line @next/next/no-img-element -- profile photo
        return <img src={m.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border" />
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static PNG */}
            <img src={characterPreviewUrl(m.character)} alt="" className="h-full w-full object-contain p-0.5" />
        </span>
    )
}
