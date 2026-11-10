'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, UserPlus } from 'lucide-react'
import { toast } from '@/components/toast'
import { addWorldTesterAction, syncWorldContentAction } from '@/lib/actions/world'

/** Admin tools for a world competition: load authored missions, add preview testers. */
export default function WorldAdminPanel({ slug }: { slug: string })
{
    const router = useRouter()
    const [pending, start] = useTransition()
    const [username, setUsername] = useState('')

    function sync(overwrite: boolean)
    {
        if (overwrite && !confirm('Overwrite every mission with the authored content? Edits made in the database will be replaced.')) return
        start(async () =>
        {
            const r = await syncWorldContentAction(slug, overwrite)
            if (!r.ok) { toast.error(r.error); return }
            toast.success(`Content synced: ${r.inserted} added, ${r.updated} updated.`)
            router.refresh()
        })
    }

    function addTester()
    {
        if (!username.trim()) return
        start(async () =>
        {
            const r = await addWorldTesterAction(slug, username)
            if (!r.ok) { toast.error(r.error); return }
            toast.success(`@${username.replace(/^@/, '')} can now test this competition.`)
            setUsername('')
        })
    }

    return (
        <section className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Admin tools</h2>
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => sync(false)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Load missing missions
                </button>
                <button type="button" disabled={pending} onClick={() => sync(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-60">
                    Overwrite all from content files
                </button>
            </div>
            <div className="flex gap-2">
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username to add as a preview tester"
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                />
                <button type="button" disabled={pending} onClick={addTester} className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-bold text-background hover:opacity-90 disabled:opacity-60">
                    <UserPlus className="h-3.5 w-3.5" /> Add tester
                </button>
            </div>
        </section>
    )
}
