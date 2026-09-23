import
{
    Home,
    Search,
    Users,
    ShoppingBag,
    BookOpen,
    Briefcase,
    Wallet,
    HandCoins,
    LayoutGrid,
    MessageCircle,
    Bell,
    Menu,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonAvatar, SkeletonBlock, SkeletonLine, WAVE_STEP } from './primitives'

const NAV_ITEMS = [
    Home, Search, Users, ShoppingBag, BookOpen, Briefcase,
    Wallet, HandCoins, LayoutGrid, MessageCircle, Bell,
]

/**
 * Full app-shell skeleton — fake top bar + sidebar (same structure as the
 * real TopBar/Sidebar, so nothing jumps when the real chrome mounts) around
 * a content slot. This is what root `app/loading.tsx` shows on a cold
 * load into `/app/*` (the layout's own auth/profile fetch is what suspends
 * there, so the real AppShell isn't mounted yet — this stands in for it).
 * Route-level loading.tsx files render content-only skeletons instead,
 * since by the time those fire the real shell is already on screen.
 */
export default function AppShellSkeleton({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center gap-3 px-4 sm:px-6 bg-card border-b border-border">
                <Menu className="w-5 h-5 text-muted-foreground/30 shrink-0 lg:hidden" />

                <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="w-[30px] h-[30px] rounded-md" />
                    <Skeleton className="hidden sm:block h-5 w-20 rounded-full" delay={WAVE_STEP} />
                </div>

                <div className="flex-1 max-w-xl mx-auto">
                    <Skeleton className="h-9 w-full rounded-full" delay={WAVE_STEP * 2} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="hidden sm:block h-9 w-10 rounded-xl" delay={WAVE_STEP * 3} />
                    <Skeleton className="hidden sm:block h-9 w-10 rounded-xl" delay={WAVE_STEP * 4} />
                    <Skeleton className="h-9 w-9 rounded-full" delay={WAVE_STEP * 5} />
                    <Skeleton className="h-9 w-9 rounded-full" delay={WAVE_STEP * 6} />
                    <SkeletonAvatar size={32} delay={WAVE_STEP * 7} />
                </div>
            </header>

            <aside className="hidden lg:flex sticky top-16 h-[calc(100vh-4rem)] w-20 xl:w-64 shrink-0 flex-col bg-card border-r border-border">
                <nav className="flex-1 px-2 py-3 space-y-1">
                    {NAV_ITEMS.map((Icon, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl lg:justify-center xl:justify-start">
                            <Icon className="w-5 h-5 text-muted-foreground/25 shrink-0" strokeWidth={1.9} />
                            <Skeleton delay={i * WAVE_STEP} className="hidden xl:block h-3 flex-1 rounded-full" />
                        </div>
                    ))}
                </nav>
                <div className="px-2 py-3 border-t border-border">
                    <div className="flex items-center gap-2.5 px-3 py-2">
                        <SkeletonAvatar size={32} />
                        <div className="hidden xl:block flex-1 space-y-1.5">
                            <SkeletonLine width="70%" height={10} delay={WAVE_STEP} />
                            <SkeletonLine width="45%" height={9} delay={WAVE_STEP * 2} />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-h-screen pt-16 pb-16 lg:pb-0 overflow-x-hidden">
                {children ?? <GenericContentSkeleton />}
            </main>
        </div>
    )
}

/** Reasonable stand-in for whichever page is actually loading underneath. */
function GenericContentSkeleton() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <SkeletonBlock className="h-44 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonBlock key={i} delay={i * WAVE_STEP} className="h-40 w-full" />
                ))}
            </div>
        </div>
    )
}
