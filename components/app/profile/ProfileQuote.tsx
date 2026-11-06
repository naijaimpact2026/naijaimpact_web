import { Quote } from 'lucide-react'
import type { User } from '@/lib/types'

/** Renders users.quote if set, else hidden entirely. */
export default function ProfileQuote({ profile }: { profile: User })
{
    if (!profile.quote) return null

    return (
        <div className="rounded-2xl bg-secondary text-white p-4 shadow-sm">
            <Quote className="w-4 h-4 text-lime mb-2" />
            <p className="text-xs italic leading-relaxed text-white/90">{profile.quote}</p>
            <p className="text-[11px] font-semibold text-lime mt-2">— {profile.display_name}</p>
        </div>
    )
}
