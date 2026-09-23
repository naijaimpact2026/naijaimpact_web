// Previous implementation — a bare full-screen logo mark that blanked out
// everything underneath (sidebar included) while it was showing. This is
// the boundary that catches the /app layout's own auth/profile fetch on a
// cold load (the layout hasn't rendered AppShell yet at that point, so
// there's no real chrome to show through), which is why it needs to look
// like the app shell rather than a spinner.
// import LogoLoader from '@/components/LogoLoader'
// export default function Loading() {
//     return <LogoLoader />
// }

import AppShellSkeleton from '@/components/app/skeletons/AppShellSkeleton'

export default function Loading() {
    return <AppShellSkeleton />
}
