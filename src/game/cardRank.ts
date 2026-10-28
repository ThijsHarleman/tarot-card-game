import type { TarotCard } from './cards/card'
import { RANKS } from './cards/card'

/**
 * Returns the game's numeric value for a card.
 *
 * Ace: 0
 * Two through King: 1–13
 * Major Arcana 0 through 21: 14–35
 */
export function getCardRank(card: TarotCard): number {
    if (card.kind === 'major') {
        return RANKS.length + card.number
    }

    return RANKS.indexOf(card.rank)
}

/**
 * An ace can be played on any card.
 * Other cards must outrank the last card played.
 * If no card has been played this round, any card is legal.
 */
export function canPlayCard(
    card: TarotCard,
    previousCard?: TarotCard,
): boolean {
    if (card.kind === 'minor' && card.rank === 'ace') {
        return true
    }

    if (previousCard === undefined) {
        return true
    }

    return getCardRank(card) > getCardRank(previousCard)
}
