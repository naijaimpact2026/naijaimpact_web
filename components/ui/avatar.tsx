'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

export const AFRICAN_AVATAR_LIST = [
  '/images/avatars/chioma.jpg',
  '/images/avatars/tunde.jpg',
  '/images/avatars/fatima.jpg',
  '/images/testimonials/adebayo-oluwaseun.jpg',
  '/images/testimonials/aisha-musa.jpg',
  '/images/testimonials/emeka-obi.jpg',
] as const

/**
 * Deterministically returns an authentic Black African avatar photo URL based on a seed string (e.g. user ID, name, email).
 */
export function getDeterministicAfricanAvatar(seed?: string | number): string {
  if (!seed) return AFRICAN_AVATAR_LIST[0]
  const str = String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % AFRICAN_AVATAR_LIST.length
  return AFRICAN_AVATAR_LIST[index]
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-primary/10 text-primary font-bold flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

interface AfricanAvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  src?: string | null
  alt?: string
  name?: string
  seed?: string | number
  imageClassName?: string
}

function AfricanAvatar({
  src,
  alt = 'Member avatar',
  name,
  seed,
  className,
  imageClassName,
  ...props
}: AfricanAvatarProps) {
  const effectiveSrc =
    src || (seed || name ? getDeterministicAfricanAvatar(seed || name) : undefined)
  const fallbackInitials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'HI'

  return (
    <Avatar className={className} {...props}>
      {effectiveSrc && (
        <AvatarImage src={effectiveSrc} alt={alt} className={imageClassName} />
      )}
      <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
        {fallbackInitials}
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AfricanAvatar }
