import {
    getLegalCards,
    passTurn,
    playCard,
} from '../game'
import type { GameState } from '../game'
import type { OpponentDecision } from './strategy'

export function executeOpponentDecision(
    state: GameState,
    decision: OpponentDecision,
): GameState {
    if (state.isGameOver || state.activePlayerId !== 'opponent') {
        return state
    }

    const legalCards = getLegalCards(state)

    // Always pass when no legal card can be played.
    if (legalCards.length === 0) {
        return passTurn(state)
    }

    if (decision.type === 'pass') {
        // The game rules already disallow passing before the first bid.
        return passTurn(state)
    }

    // Reject a strategy decision that attempts an illegal play.
    if (!legalCards.some((card) => card.id === decision.cardId)) {
        return state
    }

    return playCard(state, decision.cardId)
}
