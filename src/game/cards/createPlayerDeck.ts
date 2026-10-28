import type { MinorArcanaCard, Suit } from './card'
import { RANKS } from './card'

export function createPlayerDeck(
    suits: readonly [Suit, Suit],
): MinorArcanaCard[] {
    return suits.flatMap((suit) =>
        RANKS.map((rank) => ({
            kind: 'minor' as const,
            id: `minor-${suit}-${rank}` as const,
            suit,
            rank,
        })),
    )
}
