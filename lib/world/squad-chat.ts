import { StreamChat } from 'stream-chat'
import { createServiceClient } from '@/lib/supabase/service'

/*
 * Squad group chats on Stream (server side). Channel ids start with
 * "group_" so the existing Chat screens show them as group chats.
 * Every call is best-effort: squad changes never fail because of chat.
 */

export const squadChannelId = (squadId: string) => `group_squad_${squadId.replace(/-/g, '')}`

function client(): StreamChat | null
{
    const key = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY
    const secret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET
    return key && secret ? StreamChat.getInstance(key, secret) : null
}

async function upsertUsers(chat: StreamChat, ids: string[])
{
    const { data } = await createServiceClient().from('users').select('id, display_name, username, avatar_url').in('id', ids)
    const rows = (data ?? []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[]
    if (rows.length) await chat.upsertUsers(rows.map((u) => ({ id: u.id, name: u.display_name || u.username || 'Player', image: u.avatar_url ?? undefined })))
}

async function attempt(label: string, fn: (chat: StreamChat) => Promise<unknown>): Promise<boolean>
{
    const chat = client()
    if (!chat) return false
    try { await fn(chat); return true }
    catch (e) { console.error(`squad chat: ${label} failed:`, e instanceof Error ? e.message : e); return false }
}

/** Create the channel if needed and make sure these users are members. */
export function ensureSquadChat(channelId: string, name: string, leaderId: string | null, memberIds: string[])
{
    return attempt('ensure', async (chat) =>
    {
        await upsertUsers(chat, memberIds)
        const ch = chat.channel('messaging', channelId, {
            name: `${name} · Squad`, isGroup: true, squad: true, created_by_id: leaderId ?? memberIds[0], members: memberIds,
        } as Record<string, unknown>)
        await ch.create()
        const have = new Set(Object.keys(ch.state.members ?? {}))
        const missing = memberIds.filter((id) => !have.has(id))
        if (missing.length) await ch.addMembers(missing)
    })
}

export function addToSquadChat(channelId: string, userId: string, name: string)
{
    return attempt('add', async (chat) =>
    {
        await upsertUsers(chat, [userId])
        await chat.channel('messaging', channelId).addMembers([userId], { text: `${name} joined the squad 👋`, user_id: userId })
    })
}

export function removeFromSquadChat(channelId: string, userId: string)
{
    return attempt('remove', (chat) => chat.channel('messaging', channelId).removeMembers([userId]))
}

export function renameSquadChat(channelId: string, name: string)
{
    return attempt('rename', (chat) => chat.channel('messaging', channelId).updatePartial({ set: { name: `${name} · Squad` } as never }))
}

export function deleteSquadChat(channelId: string)
{
    return attempt('delete', (chat) => chat.channel('messaging', channelId).delete())
}
