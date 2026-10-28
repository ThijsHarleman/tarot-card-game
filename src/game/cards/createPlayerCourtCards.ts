import type { MinorArcanaCard, Suit } from './card'
import { RANKS } from './card'

const COURT_RANKS = RANKS.slice(10)

export function createPlayerCourtCards(suit: Suit): MinorArcanaCard[] {
    return COURT_RANKS.map((rank) => ({
        kind: 'minor' as const,
        id: `minor-${suit}-${rank}` as const,
        suit,
        rank,
    }))
}
