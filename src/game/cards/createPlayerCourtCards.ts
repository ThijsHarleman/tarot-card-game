import type { MinorArcanaCard, Suit } from './card'
import { RANKS } from './card'

const COURT_RANKS = RANKS.slice(10)

export function createPlayerCourtCards(
    suits: readonly [Suit, Suit],
): MinorArcanaCard[] {
    return suits.flatMap((suit) =>
        COURT_RANKS.map((rank) => ({
            kind: 'minor' as const,
            id: `minor-${suit}-${rank}` as const,
            suit,
            rank,
        })),
    )
}
