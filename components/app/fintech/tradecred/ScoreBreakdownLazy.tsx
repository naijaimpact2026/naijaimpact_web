'use client'

import dynamic from 'next/dynamic'

// recharts is a sizeable client-only chart library — code-split it out of
// the initial bundle rather than eagerly importing it at the top of a
// server-rendered page. `ssr: false` requires this indirection: it's only
// allowed from within a Client Component boundary, not directly in the
// (server) page that renders it.
const ScoreBreakdown = dynamic(() => import('./ScoreBreakdown'), { ssr: false })

export default ScoreBreakdown
