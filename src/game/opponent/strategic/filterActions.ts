import type { GameState } from '../../game'
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

        // Never play a Major Arcana worth more than half
        // the current prize.
        if (
            card.kind === 'major' &&
            card.number > state.currentMajorArcana.number / 2
        ) {
            return false
        }

        return true
    })
}
