// Previous implementation — full-screen logo mark. By the time this
// boundary fires (the /app root page itself, or any nested page under
// /app that doesn't have its own loading.tsx) the real AppShell is
// already mounted, so this only needs to cover the content area.
// import LogoLoader from '@/components/LogoLoader'
// export default function Loading() {
//     return <LogoLoader />
// }

import HomeSkeleton from '@/components/app/skeletons/HomeSkeleton'

export default function Loading() {
    return <HomeSkeleton />
}
