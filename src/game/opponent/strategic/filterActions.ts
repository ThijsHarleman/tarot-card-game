import type { GameState } from '../../game'
import type { TarotCard } from '../../../game/cards/card'
import type { CardActionEvaluation } from './evaluateCardActions'

export function filterCardActions(
    state: GameState,
    evaluations: CardActionEvaluation[],
): CardActionEvaluation[] {
    const activePlayer = state.opponent
    const previousCard = state.playedCards.at(-1)

    const hasAlternativeMinorArcana = [
        ...activePlayer.hand,
        ...activePlayer.courtCards,
    ].some(card => card.kind === 'minor' && card.rank !== 'ace')

    return evaluations.filter(({ card }) => {
        // Never play an Ace on an opening bid.
        if (card.kind === 'minor' && card.rank === 'ace') {
            if (!previousCard) return false

            // Preserve the Ace against anything below Page
            // if another Minor Arcana is available.
            if (
                previousCard.kind === 'minor' &&
                previousCard.rank !== 'page' &&
                previousCard.rank !== 'knight' &&
                previousCard.rank !== 'queen' &&
                previousCard.rank !== 'king' &&
                hasAlternativeMinorArcana
            ) {
                return false
            }
        }

        if (!isMajorArcanaWorthPlaying(state, card)) {
            return false
        }

        return true
    })
}

function getCurrentBidMajorArcanaValue(
    state: GameState,
): number {
    return state.playedCards.reduce(
        (total, card) =>
            card.kind === 'major'
                ? total + card.number
                : total,
        0,
    )
}

function isMajorArcanaWorthPlaying(
    state: GameState,
    card: TarotCard,
): boolean {
    if (card.kind !== 'major') return true

    const prizeValue = state.currentMajorArcana.number
    const currentBidValue = getCurrentBidMajorArcanaValue(state)

    return currentBidValue + card.number <= prizeValue
}
