'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp, Loader2, X } from 'lucide-react'
import { toast } from '@/components/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createProofUpload, submitProof } from '@/lib/actions/competitions'
import { PROOF_CONTENT_TYPES, PROOF_MAX_BYTES, type MissionView } from '@/lib/competitions/config'

interface Props
{
    mission: MissionView
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ProofDialog({ mission, open, onOpenChange }: Props)
{
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [link, setLink] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)

    function pickFile(f: File | null)
    {
        if (!f) return setFile(null)
        if (!(PROOF_CONTENT_TYPES as readonly string[]).includes(f.type)) { toast.error('Upload a JPG, PNG, WebP or PDF.'); return }
        if (f.size > PROOF_MAX_BYTES) { toast.error('Files must be 10 MB or smaller.'); return }
        setFile(f)
    }

    async function submit()
    {
        if (!file && !link.trim()) { toast.error('Add a file or a link as proof.'); return }
        setBusy(true)
        try
        {
            let key: string | null = null
            if (file)
            {
                const up = await createProofUpload({ missionId: mission.id, contentType: file.type, sizeBytes: file.size })
                if (!up.ok) { toast.error(up.error); return }
                const put = await fetch(up.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
                if (!put.ok) { toast.error('Upload failed. Please try again.'); return }
                key = up.key
            }
            const res = await submitProof({ missionId: mission.id, key, link: link.trim() || null, note: note.trim() || null })
            if (!res.ok) { toast.error(res.error); return }
            toast.success('Submitted! An admin will review it soon.')
            onOpenChange(false)
            setFile(null); setLink(''); setNote('')
            router.refresh()
        } catch
        {
            toast.error('Something went wrong. Please try again.')
        } finally
        {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mission.title}</DialogTitle>
                    <DialogDescription>{mission.proof_hint ?? 'Share proof that you completed this mission.'}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={PROOF_CONTENT_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                            <FileUp className="h-4 w-4 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                            <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="rounded-full p-1 hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center hover:bg-muted/50"
                        >
                            <FileUp className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Upload a screenshot or PDF</span>
                            <span className="text-xs text-muted-foreground">JPG, PNG, WebP or PDF · up to 10 MB</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
                        <span className="h-px flex-1 bg-border" /> or paste a link <span className="h-px flex-1 bg-border" />
                    </div>
                    <input
                        type="url"
                        inputMode="url"
                        placeholder="https://instagram.com/p/…"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                    <textarea
                        placeholder="Anything the reviewer should know? (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={submit}
                        disabled={busy}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for review
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
