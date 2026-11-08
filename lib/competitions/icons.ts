import
{
    BookOpen,
    Briefcase,
    Building2,
    Clapperboard,
    Flag,
    GraduationCap,
    HandCoins,
    Radio,
    Rocket,
    ShoppingBag,
    Store,
    Trophy,
    Truck,
    Wrench,
    type LucideIcon,
} from 'lucide-react'

/** Icon keys stored in competitions.icon / competition_zones.icon. */
export const COMPETITION_ICONS: Record<string, LucideIcon> = {
    'shopping-bag': ShoppingBag,
    briefcase: Briefcase,
    clapperboard: Clapperboard,
    wrench: Wrench,
    rocket: Rocket,
    'hand-coins': HandCoins,
    'graduation-cap': GraduationCap,
    flag: Flag,
    trophy: Trophy,
    store: Store,
    'book-open': BookOpen,
    truck: Truck,
    radio: Radio,
    building: Building2,
}

export function competitionIcon(key: string | null | undefined): LucideIcon
{
    return (key && COMPETITION_ICONS[key]) || Trophy
}

/**
 * Static nav list for the sidebar (no DB call in the shell). Order follows
 * the product brief; the index page shows live status from the DB.
 */
export const COMPETITION_NAV = [
    { slug: 'campus', label: 'Campus Competition', icon: GraduationCap },
    { slug: 'creators', label: 'Creators Challenge', icon: Clapperboard },
    { slug: 'artisan', label: 'Artisan Competition', icon: Wrench },
    { slug: 'marketplace', label: 'Marketplace Competition', icon: ShoppingBag },
    { slug: 'impact', label: 'Impact Challenge', icon: HandCoins },
    { slug: 'launchpad', label: 'Business LaunchPad', icon: Rocket },
    { slug: 'nysc', label: 'NYSC Competition', icon: Flag },
    { slug: 'career', label: 'Career / Employability', icon: Briefcase },
] as const
