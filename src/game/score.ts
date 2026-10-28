import type { MajorArcanaCard, TarotCard } from './cards/card'
import type { Player } from './player'

/**
 * Returns the Major Arcana cards currently held by a player.
 * The player's deck, hand, and discard pile are the source of truth.
 */
export function getOwnedMajorArcana(player: Player): MajorArcanaCard[] {
    const cards: TarotCard[] = [
        ...player.deck,
        ...player.hand,
        ...player.discardPile,
    ]

    return cards.filter(
        (card): card is MajorArcanaCard => card.kind === 'major',
    )
}

/**
 * Calculates a player's score from their currently owned Major Arcana.
 */
export function calculateScore(player: Player): number {
    return getOwnedMajorArcana(player).reduce(
        (total, card) => total + card.number,
        0,
    )
}
