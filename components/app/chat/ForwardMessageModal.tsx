'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { StreamChat, Channel as StreamChannel } from 'stream-chat'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Forward,
  Search,
  Check,
  Loader2,
  Users,
  User as UserIcon,
  X,
  MessageSquare,
  ImageIcon,
} from 'lucide-react'
import { fetchFollowingForChat, startDmChat } from '@/lib/actions/chat'
import { toast } from '@/components/toast'

interface ForwardMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: any
  client: StreamChat | null
  currentChannelId?: string
}

interface ForwardTarget {
  id: string
  name: string
  image?: string
  isGroup: boolean
  isChannel: boolean // true = existing channel, false = user contact
  channelId?: string
  userId?: string
  subtitle?: string
}

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
  client,
  currentChannelId,
}: ForwardMessageModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [userComment, setUserComment] = useState('')
  const [targets, setTargets] = useState<ForwardTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMap, setSendingMap] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  // Load user's recent channels & followed contacts
  useEffect(() => {
    if (!isOpen || !client) return

    let cancelled = false

    async function loadTargets() {
      try {
        setLoading(true)
        const currentUserId = client!.userID

        // 1. Query existing channels (conversations)
        const channels = await client!.queryChannels(
          { type: 'messaging', members: { $in: [currentUserId as string] } },
          { last_message_at: -1 },
          { watch: false, limit: 30 }
        )

        // 2. Fetch people the user follows
        const following = await fetchFollowingForChat().catch(() => [])

        if (cancelled) return

        const targetList: ForwardTarget[] = []
        const seenUserIds = new Set<string>()

        // Format channels
        for (const ch of channels) {
          const rawData = ch.data as Record<string, unknown> | undefined
          const members = Object.values(ch.state.members)
          const otherMembers = members.filter((m) => m.user?.id !== currentUserId)
          const isGroup = (ch.id ?? '').startsWith('group_') || otherMembers.length > 1
          const otherUser = otherMembers[0]?.user

          if (!isGroup && otherUser?.id) {
            seenUserIds.add(otherUser.id)
          }

          const channelName =
            (typeof rawData?.name === 'string' ? rawData.name : undefined) ||
            otherMembers.map((m) => m.user?.name ?? m.user?.id ?? 'User').join(', ') ||
            'Conversation'

          const channelImage =
            (typeof rawData?.image === 'string' ? rawData.image : undefined) ||
            otherUser?.image

          targetList.push({
            id: `channel_${ch.id}`,
            channelId: ch.id,
            name: channelName,
            image: channelImage,
            isGroup,
            isChannel: true,
            subtitle: isGroup ? `${members.length} members` : (otherUser as any)?.username ? `@${(otherUser as any).username}` : 'Direct Message',
          })
        }

        // Add following contacts who don't already have an active channel listed
        for (const user of following) {
          if (!seenUserIds.has(user.id) && user.id !== currentUserId) {
            targetList.push({
              id: `user_${user.id}`,
              userId: user.id,
              name: user.display_name || user.username || 'User',
              image: user.avatar_url ?? undefined,
              isGroup: false,
              isChannel: false,
              subtitle: `@${user.username}`,
            })
          }
        }

        setTargets(targetList)
      } catch (err) {
        console.error('Failed to load forward targets:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTargets()

    return () => {
      cancelled = true
    }
  }, [isOpen, client])

  // Filter targets based on search query
  const filteredTargets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return targets
    return targets.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(q))
    )
  }, [targets, searchQuery])

  // Original message metadata
  const originalAuthorName =
    message?.user?.name || message?.user?.id || 'Unknown'
  const originalText = message?.text || ''
  const hasImages = message?.attachments?.some(
    (a: any) => a.type === 'image' || a.image_url || a.thumb_url
  )
  const imageAttachments = (message?.attachments || []).filter(
    (a: any) => a.type === 'image' || a.image_url || a.thumb_url
  )

  const handleForwardToTarget = async (target: ForwardTarget) => {
    if (!client || sendingMap[target.id] === 'sending' || sendingMap[target.id] === 'sent') {
      return
    }

    try {
      setSendingMap((prev) => ({ ...prev, [target.id]: 'sending' }))

      let targetChannel: StreamChannel

      if (target.isChannel && target.channelId) {
        targetChannel = client.channel('messaging', target.channelId)
      } else if (target.userId) {
        // Create or get DM channel for this user
        const { channelId } = await startDmChat(target.userId)
        targetChannel = client.channel('messaging', channelId)
      } else {
        throw new Error('Invalid forward target')
      }

      // Ensure channel is initialized
      if (!targetChannel.initialized) {
        await targetChannel.watch()
      }

      // Compose the forwarded message payload
      const trimmedComment = userComment.trim()
      let forwardedBody = ''

      if (trimmedComment) {
        forwardedBody = `${trimmedComment}\n\n↪️ *Forwarded from ${originalAuthorName}:*`
        if (originalText) forwardedBody += `\n${originalText}`
      } else {
        forwardedBody = `↪️ *Forwarded from ${originalAuthorName}:*`
        if (originalText) forwardedBody += `\n${originalText}`
      }

      // Forward attachments if any
      const forwardedAttachments = (message.attachments || []).map((att: any) => ({
        ...att,
      }))

      await targetChannel.sendMessage({
        text: forwardedBody,
        attachments: forwardedAttachments,
        is_forwarded: true,
        forwarded_from_id: message.user?.id,
        forwarded_from_name: originalAuthorName,
        original_message_id: message.id,
      } as any)

      setSendingMap((prev) => ({ ...prev, [target.id]: 'sent' }))
      toast.success(`Message forwarded to ${target.name}`)
    } catch (err: any) {
      console.error('Failed to forward message:', err)
      setSendingMap((prev) => ({ ...prev, [target.id]: 'error' }))
      toast.error(err?.message || 'Failed to forward message')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Forward className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Forward Message
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Share this message with another person or group
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 flex flex-col gap-4">
          {/* Message Preview Snippet */}
          <div className="p-3 rounded-xl bg-muted/50 border-l-4 border-l-primary border border-border/40 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={message?.user?.image} />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {originalAuthorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground text-xs">
                {originalAuthorName}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Original Message
              </span>
            </div>

            {originalText && (
              <p className="text-foreground/90 line-clamp-3 whitespace-pre-wrap pl-7">
                {originalText}
              </p>
            )}

            {hasImages && (
              <div className="flex items-center gap-2 pl-7 mt-1">
                <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  {imageAttachments.length} {imageAttachments.length === 1 ? 'image' : 'images'} attached
                </span>
              </div>
            )}
          </div>

          {/* Optional User Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Add note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Write a message to accompany this..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-muted/60 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
            />
          </div>

          {/* Search Targets Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or contacts..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-muted/60 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Target List */}
          <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredTargets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {searchQuery ? `No chats found matching "${searchQuery}"` : 'No contacts or conversations found'}
              </div>
            ) : (
              filteredTargets.map((target) => {
                const state = sendingMap[target.id] || 'idle'
                const isSent = state === 'sent'
                const isSending = state === 'sending'

                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar className="w-9 h-9 border border-border/50 shrink-0">
                        <AvatarImage src={target.image} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {target.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {target.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                          {target.isGroup ? (
                            <Users className="w-3 h-3 text-primary inline" />
                          ) : (
                            <UserIcon className="w-3 h-3 text-muted-foreground inline" />
                          )}
                          <span>{target.subtitle}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleForwardToTarget(target)}
                      disabled={isSending || isSent}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                        isSent
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                          : isSending
                          ? 'bg-primary/20 text-primary cursor-wait'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs active:scale-95'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Sent</span>
                        </>
                      ) : isSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending</span>
                        </>
                      ) : (
                        <>
                          <Forward className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Forward</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
