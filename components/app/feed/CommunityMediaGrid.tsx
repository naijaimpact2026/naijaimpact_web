'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Heart,
    MessageCircle,
    Layers,
    Play,
    User as UserIcon,
    Sparkles,
} from 'lucide-react'
import type { PostWithAuthor } from '@/lib/types'
import { shouldSkipImageOptimization } from '@/lib/supabase-image'

interface Props {
    posts: PostWithAuthor[]
    onPostClick?: (post: PostWithAuthor) => void
}

export default function CommunityMediaGrid({ posts }: Props) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {posts.map((post) => {
                const firstMedia = post.medias?.[0]
                const hasMedia = Boolean(firstMedia?.url)
                const isVideo = firstMedia?.media_type === 'video'
                const isMulti = (post.medias?.length || 0) > 1

                return (
                    <Link
                        key={post.id}
                        href={`/app/feed/${post.id}`}
                        className="group relative aspect-square overflow-hidden rounded-2xl bg-muted border border-border/70 cursor-pointer block select-none shadow-xs"
                    >
                        {hasMedia ? (
                            <>
                                {isVideo ? (
                                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                        <div className="flex flex-col items-center justify-center gap-1 text-white/70">
                                            <Play className="w-8 h-8 fill-white/20 text-white" />
                                            <span className="text-[10px] font-semibold">Video</span>
                                        </div>
                                        <span className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                                            <Play className="w-3.5 h-3.5 fill-white text-white" />
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <Image
                                            src={firstMedia.url}
                                            alt={post.caption || 'Community post'}
                                            fill
                                            unoptimized={shouldSkipImageOptimization(firstMedia.url)}
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, 33vw"
                                        />
                                        {isMulti && (
                                            <span className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                                                <Layers className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            /* Text-only post in Instagram grid format — stylized gradient card */
                            <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-primary/10 via-card to-muted border border-primary/20">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3" /> Note
                                </span>
                                <p className="text-xs font-semibold text-foreground line-clamp-4 leading-relaxed">
                                    {post.caption || 'Thought from ' + post.author.display_name}
                                </p>
                                <span className="text-[10px] text-muted-foreground font-medium truncate">
                                    @{post.author.username}
                                </span>
                            </div>
                        )}

                        {/* Instagram-style Hover Overlay */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span className="truncate max-w-[100px]">@{post.author.username}</span>
                            </div>

                            {/* Centered Likes & Comments count */}
                            <div className="flex items-center justify-center gap-4 text-sm font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 fill-white text-white" />
                                    <span>{(post.reaction_count || 0).toLocaleString()}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                                    <span>{(post.comment_count || 0).toLocaleString()}</span>
                                </span>
                            </div>

                            <p className="text-[10px] text-white/80 line-clamp-1 truncate">
                                {post.caption || 'View post'}
                            </p>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
