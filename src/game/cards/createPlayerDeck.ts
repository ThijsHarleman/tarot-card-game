import type { MinorArcanaCard, Suit } from './card'
import { RANKS } from './card'

const NUMBERED_RANKS = RANKS.slice(0, 10)

export function createPlayerDeck(
    suits: readonly [Suit, Suit],
): MinorArcanaCard[] {
    return suits.flatMap((suit) =>
        NUMBERED_RANKS.map((rank) => ({
            kind: 'minor' as const,
            id: `minor-${suit}-${rank}` as const,
            suit,
            rank,
        })),
    )
}
