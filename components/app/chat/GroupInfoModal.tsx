'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Channel as StreamChannel } from 'stream-chat'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Crown, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'
import { getChannelMembersProfiles } from '@/lib/actions/chat'

interface GroupInfoModalProps {
  isOpen: boolean
  onClose: () => void
  channel: StreamChannel
  currentUserId?: string
}

interface MemberProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio?: string | null
  verified?: boolean
}

export default function GroupInfoModal({
  isOpen,
  onClose,
  channel,
  currentUserId,
}: GroupInfoModalProps) {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({})
  const [loading, setLoading] = useState(false)

  const rawData = channel.data as Record<string, unknown> | undefined
  const customData = rawData?.custom as Record<string, unknown> | undefined
  const groupName =
    (typeof rawData?.name === 'string' && rawData.name) ||
    (typeof customData?.name === 'string' && customData.name) ||
    'Group Chat'
  const groupImage =
    (typeof rawData?.image === 'string' && rawData.image) ||
    (typeof customData?.image === 'string' && customData.image) ||
    undefined

  const createdById = (rawData?.created_by_id as string) || (rawData?.created_by as any)?.id
  const members = Object.values(channel.state.members)
  const onlineCount = members.filter((m) => m.user?.online).length

  const initials = groupName
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    if (!isOpen) return

    async function loadProfiles() {
      try {
        setLoading(true)
        const userIds = members.map((m) => m.user?.id).filter(Boolean) as string[]
        const data = await getChannelMembersProfiles(userIds)
        const map: Record<string, MemberProfile> = {}
        for (const p of data) {
          map[p.id] = p
        }
        setProfiles(map)
      } catch (err) {
        console.error('Failed to load group member profiles:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [isOpen, channel])

  const handleMemberClick = (userId: string) => {
    const profile = profiles[userId]
    if (profile?.username) {
      onClose()
      router.push(`/app/profile/${profile.username}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border flex flex-col items-center text-center">
          <div className="relative mb-3">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
              <AvatarImage src={groupImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {initials || <Users className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 p-1 rounded-full bg-card border border-border shadow-xs">
              <Users className="w-3.5 h-3.5 text-primary" />
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground truncate max-w-[280px]">
            {groupName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {members.length} members ·{' '}
            <span className="text-emerald-500 font-medium">{onlineCount} online</span>
          </p>
        </DialogHeader>

        {/* Member list section */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-border/50">
          <div className="pb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Group Members ({members.length})
            </h4>
          </div>

          {loading && Object.keys(profiles).length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {members.map((member) => {
                const u = member.user
                if (!u) return null
                const profile = profiles[u.id]
                const isOnline = Boolean(u.online)
                const isCreator = u.id === createdById
                const isSelf = u.id === currentUserId
                const displayName = profile?.display_name || u.name || 'Member'
                const username = profile?.username

                const memberInitials = displayName
                  .split(' ')
                  .map((p) => p[0] ?? '')
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div
                    key={u.id}
                    onClick={() => handleMemberClick(u.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={profile?.avatar_url || u.image} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {memberInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
                            isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {displayName}
                          </p>
                          {profile?.verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                          {isSelf && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                              You
                            </span>
                          )}
                          {isCreator && (
                            <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium shrink-0">
                              <Crown className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {username ? `@${username}` : isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <button
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all shrink-0"
                      title="View Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
