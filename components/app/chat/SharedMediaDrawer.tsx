'use client'

import { useEffect, useState, useMemo } from 'react'
import type { Channel as StreamChannel, LocalMessage, Attachment } from 'stream-chat'
import
{
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import
{
    Image as ImageIcon,
    FileText,
    Link2,
    Download,
    ExternalLink,
    Play,
    Loader2,
    X,
    FileArchive,
    FileSpreadsheet,
    FileCode,
    Music,
    File,
} from 'lucide-react'

interface SharedMediaDrawerProps
{
    isOpen: boolean
    onClose: () => void
    channel: StreamChannel
}

interface MediaItem
{
    id: string
    type: 'image' | 'video'
    url: string
    thumbUrl?: string
    name?: string
    createdAt: Date
    senderName?: string
}

interface FileItem
{
    id: string
    name: string
    url: string
    size?: number | string
    mimeType?: string
    createdAt: Date
    senderName?: string
}

interface LinkItem
{
    id: string
    url: string
    title?: string
    snippet?: string
    domain: string
    createdAt: Date
    senderName?: string
}

function formatBytes(bytes?: number | string): string
{
    if (!bytes) return '0 B'
    const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes
    if (isNaN(num) || num === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(num) / Math.log(k))
    return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(date: Date): string
{
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    })
}

function getFileIcon(name: string, mime?: string)
{
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf' || mime?.includes('pdf'))
    {
        return <FileText className="w-5 h-5 text-rose-500 shrink-0" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime?.includes('zip'))
    {
        return <FileArchive className="w-5 h-5 text-amber-500 shrink-0" />
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime?.includes('excel') || mime?.includes('spreadsheet'))
    {
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'go'].includes(ext))
    {
        return <FileCode className="w-5 h-5 text-indigo-500 shrink-0" />
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext) || mime?.includes('audio'))
    {
        return <Music className="w-5 h-5 text-purple-500 shrink-0" />
    }
    return <File className="w-5 h-5 text-primary shrink-0" />
}

export default function SharedMediaDrawer({
    isOpen,
    onClose,
    channel,
}: SharedMediaDrawerProps)
{
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<MediaItem | null>(null)

    // Load recent channel messages to extract all attachments & links
    useEffect(() =>
    {
        if (!isOpen) return

        let cancelled = false
        async function fetchContent()
        {
            try
            {
                setLoading(true)
                // Combine currently cached state messages with a query to ensure historical media is captured
                const stateMsgs = channel.state.messages || []
                let fetchedMsgs: any[] = []
                try
                {
                    const res = await channel.query({ messages: { limit: 100 } })
                    fetchedMsgs = (res.messages as any[]) || []
                } catch {
                    // Fallback to channel.state.messages
                }

                if (cancelled) return

                // Deduplicate messages by ID
                const map = new Map<string, any>()
                for (const m of [...stateMsgs, ...fetchedMsgs])
                {
                    if (m?.id) map.set(m.id, m)
                }
                setMessages(Array.from(map.values()))
            } catch (err)
            {
                console.error('[SharedMediaDrawer] Failed to query messages:', err)
            } finally
            {
                if (!cancelled) setLoading(false)
            }
        }

        fetchContent()
        return () => { cancelled = true }
    }, [isOpen, channel])

    // Parse Media (Images & Videos)
    const mediaItems = useMemo<MediaItem[]>(() =>
    {
        const items: MediaItem[] = []
        for (const msg of messages)
        {
            if (!msg.attachments || msg.attachments.length === 0) continue
            const createdAt = msg.created_at ? new Date(msg.created_at) : new Date()
            const senderName = msg.user?.name || msg.user?.id

            for (let i = 0; i < msg.attachments.length; i++)
            {
                const att = msg.attachments[i]
                const type = att.type
                const mime = att.mime_type || ''
                const url = att.asset_url || att.image_url || att.thumb_url

                if (!url) continue

                const isImage = type === 'image' || mime.startsWith('image/') || att.image_url
                const isVideo = type === 'video' || mime.startsWith('video/')

                if (isImage)
                {
                    items.push({
                        id: `${msg.id}_${i}`,
                        type: 'image',
                        url: att.asset_url || att.image_url || url,
                        thumbUrl: att.thumb_url || att.image_url || url,
                        name: att.title || att.fallback || 'Image',
                        createdAt,
                        senderName,
                    })
                } else if (isVideo)
                {
                    items.push({
                        id: `${msg.id}_${i}`,
                        type: 'video',
                        url: att.asset_url || url,
                        thumbUrl: att.thumb_url,
                        name: att.title || 'Video',
                        createdAt,
                        senderName,
                    })
                }
            }
        }
        return items.reverse()
    }, [messages])

    // Parse Documents & Files
    const fileItems = useMemo<FileItem[]>(() =>
    {
        const items: FileItem[] = []
        for (const msg of messages)
        {
            if (!msg.attachments || msg.attachments.length === 0) continue
            const createdAt = msg.created_at ? new Date(msg.created_at) : new Date()
            const senderName = msg.user?.name || msg.user?.id

            for (let i = 0; i < msg.attachments.length; i++)
            {
                const att = msg.attachments[i]
                const type = att.type
                const mime = att.mime_type || ''
                const url = att.asset_url

                if (!url) continue

                const isImage = type === 'image' || mime.startsWith('image/') || att.image_url
                const isVideo = type === 'video' || mime.startsWith('video/')
                const isAudio = type === 'audio' || type === 'voiceRecording' || mime.startsWith('audio/')
                const isFile = type === 'file' || isAudio || (!isImage && !isVideo && type !== 'link')

                if (isFile)
                {
                    items.push({
                        id: `${msg.id}_${i}`,
                        name: att.title || att.fallback || 'Document',
                        url,
                        size: att.file_size,
                        mimeType: att.mime_type,
                        createdAt,
                        senderName,
                    })
                }
            }
        }
        return items.reverse()
    }, [messages])

    // Parse Links
    const linkItems = useMemo<LinkItem[]>(() =>
    {
        const items: LinkItem[] = []
        const urlRegex = /(https?:\/\/[^\s]+)/gi

        for (const msg of messages)
        {
            const createdAt = msg.created_at ? new Date(msg.created_at) : new Date()
            const senderName = msg.user?.name || msg.user?.id

            // Check attachments of type link
            if (msg.attachments)
            {
                for (let i = 0; i < msg.attachments.length; i++)
                {
                    const att = msg.attachments[i]
                    if (att.type === 'link' || att.og_scrape_url)
                    {
                        const linkUrl = att.og_scrape_url || att.title_link || att.asset_url
                        if (linkUrl)
                        {
                            try
                            {
                                const parsed = new URL(linkUrl)
                                items.push({
                                    id: `att_${msg.id}_${i}`,
                                    url: linkUrl,
                                    title: att.title || parsed.hostname,
                                    snippet: att.text,
                                    domain: parsed.hostname.replace(/^www\./, ''),
                                    createdAt,
                                    senderName,
                                })
                            } catch {
                                // Ignore malformed url
                            }
                        }
                    }
                }
            }

            // Extract plain urls from text
            if (msg.text)
            {
                const matches = msg.text.match(urlRegex)
                if (matches)
                {
                    matches.forEach((u: string, i: number) =>
                    {
                        try
                        {
                            const parsed = new URL(u)
                            // Avoid duplicate if already in items
                            if (!items.some((existing) => existing.url === u))
                            {
                                items.push({
                                    id: `text_${msg.id}_${i}`,
                                    url: u,
                                    title: parsed.hostname,
                                    domain: parsed.hostname.replace(/^www\./, ''),
                                    createdAt,
                                    senderName,
                                })
                            }
                        } catch {
                            // Ignore invalid URL
                        }
                    })
                }
            }
        }
        return items.reverse()
    }, [messages])

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-md p-0 flex flex-col bg-card border-l border-border text-foreground z-50 shadow-2xl"
                >
                    <SheetHeader className="p-4 border-b border-border/80 shrink-0">
                        <SheetTitle className="text-base font-bold text-foreground">
                            Shared Media & Files
                        </SheetTitle>
                    </SheetHeader>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Tabs defaultValue="media" className="flex-1 flex flex-col min-h-0">
                            <div className="px-4 pt-3 pb-2 border-b border-border/60 shrink-0 bg-card">
                                <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-xl">
                                    <TabsTrigger
                                        value="media"
                                        className="text-xs font-semibold rounded-lg flex items-center gap-1.5 py-1.5"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>Media</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            ({mediaItems.length})
                                        </span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="files"
                                        className="text-xs font-semibold rounded-lg flex items-center gap-1.5 py-1.5"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Files</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            ({fileItems.length})
                                        </span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="links"
                                        className="text-xs font-semibold rounded-lg flex items-center gap-1.5 py-1.5"
                                    >
                                        <Link2 className="w-3.5 h-3.5" />
                                        <span>Links</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            ({linkItems.length})
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* ── Media Tab (Photos & Videos) ── */}
                            <TabsContent value="media" className="flex-1 min-h-0 overflow-y-auto p-4 m-0">
                                {mediaItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">No media shared yet</p>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Photos and videos sent in this chat will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {mediaItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedLightboxMedia(item)}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border border-border/50 hover:border-primary/50 transition-all shadow-xs"
                                            >
                                                {item.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-black/40 text-white relative">
                                                        {item.thumbUrl ? (
                                                            <img
                                                                src={item.thumbUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <video
                                                                src={item.url}
                                                                className="w-full h-full object-cover pointer-events-none"
                                                            />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/15 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-xs">
                                                                <Play className="w-4 h-4 fill-white ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={item.thumbUrl || item.url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                        loading="lazy"
                                                    />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-[10px] text-white">
                                                    <span className="truncate">{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Files Tab (Docs, PDFs, Archives) ── */}
                            <TabsContent value="files" className="flex-1 min-h-0 overflow-y-auto p-4 m-0 space-y-2.5">
                                {fileItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">No files shared yet</p>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Documents and files sent in this chat will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    fileItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                                                    {getFileIcon(item.name, item.mimeType)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {formatBytes(item.size)} · {formatDate(item.createdAt)}
                                                        {item.senderName && ` · ${item.senderName}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={item.url}
                                                download={item.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-primary transition-colors shrink-0 ml-2"
                                                title="Download file"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            {/* ── Links Tab (URLs & Shared Pages) ── */}
                            <TabsContent value="links" className="flex-1 min-h-0 overflow-y-auto p-4 m-0 space-y-2.5">
                                {linkItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                                            <Link2 className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">No links shared yet</p>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Web links and URLs sent in this chat will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    linkItems.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group block"
                                        >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-0.5 text-primary">
                                                    <Link2 className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {item.title || item.domain}
                                                    </p>
                                                    <p className="text-[11px] text-primary/80 truncate">
                                                        {item.url}
                                                    </p>
                                                    {item.snippet && (
                                                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                            {item.snippet}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                                                        {formatDate(item.createdAt)}
                                                        {item.senderName && ` · ${item.senderName}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2 mt-1" />
                                        </a>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Lightbox Modal for Media Preview ── */}
            {selectedLightboxMedia && (
                <div
                    className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedLightboxMedia(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedLightboxMedia(null)}
                            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                            aria-label="Close preview"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Media display */}
                        {selectedLightboxMedia.type === 'video' ? (
                            <video
                                src={selectedLightboxMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
                            />
                        ) : (
                            <img
                                src={selectedLightboxMedia.url}
                                alt={selectedLightboxMedia.name}
                                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain select-none"
                            />
                        )}

                        {/* Bottom bar with download button */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-white/80">
                            <span>{selectedLightboxMedia.name}</span>
                            <span>·</span>
                            <span>{formatDate(selectedLightboxMedia.createdAt)}</span>
                            <a
                                href={selectedLightboxMedia.url}
                                download={selectedLightboxMedia.name || 'download'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-2 font-medium"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
