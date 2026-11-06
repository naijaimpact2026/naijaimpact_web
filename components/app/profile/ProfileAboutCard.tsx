import type { User } from '@/lib/types'

/** Persistent "About Me" + "Skills" cards shown in the profile's left rail on desktop. */
export default function ProfileAboutCard({ profile }: { profile: User })
{
    return (
        <>
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">About Me</h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                    {profile.bio || 'No bio added yet.'}
                </p>
            </div>

            {profile.skills.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground">Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill) => (
                            <span key={skill} className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
