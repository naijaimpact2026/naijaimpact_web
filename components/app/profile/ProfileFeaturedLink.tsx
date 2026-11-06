import { Link2, ExternalLink } from 'lucide-react'
import type { User } from '@/lib/types'

/** Renders users.website_url if set, else hidden entirely. */
export default function ProfileFeaturedLink({ profile }: { profile: User })
{
    if (!profile.website_url) return null

    let host = profile.website_url
    try { host = new URL(profile.website_url).host } catch { /* keep raw string */ }

    return (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">Featured Link</h3>
            <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl hover:bg-muted p-1.5 -m-1.5 transition-colors group"
            >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{profile.display_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{host}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </a>
        </div>
    )
}
