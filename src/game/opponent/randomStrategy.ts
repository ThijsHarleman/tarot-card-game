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

        // Passing is allowed only after at least one card has been bid.
        const canPass = state.playedCards.length > 0

        // If passing is allowed, randomly choose between passing and playing.
        if (canPass && Math.random() < 0.5) {
            return { type: 'pass' }
        }

        // Choose randomly from legal cards only.
        const index = Math.floor(Math.random() * legalCards.length)
        const card = legalCards[index]

        // Defensive guard in case the selection unexpectedly fails.
        if (card === undefined) {
            return { type: 'pass' }
        }

        return { type: 'play', cardId: card.id }
    },
}
