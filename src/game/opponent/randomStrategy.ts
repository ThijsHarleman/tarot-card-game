import { getLegalCards } from '../game'
import type { GameState } from '../game'
import type { OpponentDecision, OpponentStrategy } from './strategy'

export const randomStrategy: OpponentStrategy = {
    name: 'Random',

    chooseAction(state: GameState): OpponentDecision {
        const legalCards = getLegalCards(state)

        // The opponent must pass if it has no legal play.
        if (legalCards.length === 0) {
            return { type: 'pass' }
        }

        // Passing is an additional option after the first bid.
        const canPass = state.playedCards.length > 0
        const optionCount = legalCards.length + (canPass ? 1 : 0)

        const selectedIndex = Math.floor(Math.random() * optionCount)

        // The final option represents passing.
        if (canPass && selectedIndex === legalCards.length) {
            return { type: 'pass' }
        }

        const selectedCard = legalCards[selectedIndex]

        if (selectedCard === undefined) {
            return { type: 'pass' }
        }

        return {
            type: 'play',
            cardId: selectedCard.id,
        }
    },
}
