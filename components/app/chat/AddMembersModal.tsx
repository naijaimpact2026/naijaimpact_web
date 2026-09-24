'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Channel as StreamChannel } from 'stream-chat'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  UserPlus,
  Check,
  Loader2,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react'
import { fetchAvailableUsersToAdd, addMembersToGroupChat } from '@/lib/actions/chat'
import { toast } from '@/components/toast'

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  channel: StreamChannel
  onMembersAdded?: () => void
}

interface CandidateUser {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  verified?: boolean
}

export default function AddMembersModal({
  isOpen,
  onClose,
  channel,
  onMembersAdded,
}: AddMembersModalProps) {
  const [candidates, setCandidates] = useState<CandidateUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Current member IDs in channel to exclude
  const existingMemberIds = useMemo(() => {
    return Object.keys(channel.state.members || {})
  }, [channel.state.members])

  // Load available users
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setLoading(true)
    if (!channel.id) return

    fetchAvailableUsersToAdd(channel.id, existingMemberIds)
      .then((users) => {
        if (!cancelled) {
          setCandidates(users)
        }
      })
      .catch((err) => {
        console.error('Failed to load candidate users:', err)
        toast.error('Failed to load contacts')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, channel.id, existingMemberIds])

  // Filter candidates by search query
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return candidates
    return candidates.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q)
    )
  }, [candidates, searchQuery])

  // Toggle selection
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  // Submit adding selected members
  const handleAddMembers = async () => {
    const ids = Array.from(selectedUserIds)
    if (ids.length === 0 || !channel.id) return

    try {
      setSubmitting(true)
      await addMembersToGroupChat(channel.id, ids)
      // Refresh local channel state
      await channel.watch()
      toast.success(
        ids.length === 1
          ? 'Added 1 new member to the group'
          : `Added ${ids.length} members to the group`
      )
      onMembersAdded?.()
      onClose()
    } catch (err: any) {
      console.error('Failed to add members:', err)
      toast.error(err.message || 'Failed to add members to group')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border text-foreground">
        <DialogHeader className="p-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Members
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select people to add to this conversation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search bar */}
        <div className="p-3 border-b border-border/70 shrink-0 bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username..."
              className="pl-9 pr-8 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground text-xs rounded-xl h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selected count chips */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto py-1">
              {Array.from(selectedUserIds).map((id) => {
                const user = candidates.find((c) => c.id === id)
                if (!user) return null
                return (
                  <span
                    key={id}
                    onClick={() => toggleSelectUser(id)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium cursor-pointer hover:bg-primary/25 shrink-0"
                  >
                    <span>{user.display_name}</span>
                    <X className="w-3 h-3" />
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs">Loading contacts...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <Users className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {searchQuery ? 'No matching contacts' : 'No available contacts'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {searchQuery
                  ? 'Try searching with a different name or username.'
                  : 'All your following contacts are already in this group.'}
              </p>
            </div>
          ) : (
            filteredCandidates.map((user) => {
              const isSelected = selectedUserIds.has(user.id)
              const initials = user.display_name
                .split(' ')
                .map((w) => w[0] ?? '')
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelectUser(user.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/25'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 border border-border shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.display_name}
                        </p>
                        {user.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 bg-card'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-border flex items-center justify-between shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">
            {selectedUserIds.size > 0
              ? `${selectedUserIds.size} selected`
              : 'Choose members to add'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddMembers}
              disabled={selectedUserIds.size === 0 || submitting}
              className="text-xs rounded-xl font-semibold gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Selected ({selectedUserIds.size})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
