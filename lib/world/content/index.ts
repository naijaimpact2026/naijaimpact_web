import { CAREER_STAGE1 } from './campus-career'
import { ENTERPRISE_STAGE1 } from './campus-enterprise'
import type { SeedMission } from './types'

/** All authored content per competition slug. */
export const WORLD_CONTENT: Record<string, SeedMission[]> = {
    campus: [...CAREER_STAGE1, ...ENTERPRISE_STAGE1],
}

export type { SeedMission }
