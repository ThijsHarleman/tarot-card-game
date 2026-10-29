
import {
    getLegalCards,
    passTurn,
    playCard,
} from '../game'
import type { GameState } from '../game'
import type { OpponentDecision } from './strategy'
import { RANKS } from '../cards/card'
import type { TarotCard } from '../cards/card'

function getFallbackCardValue(card: TarotCard): number {
    if (card.kind === 'major') {
        return RANKS.length + card.number
    }

    if (card.rank === 'ace') {
        return RANKS.indexOf('king') + 0.5
    }

    return RANKS.indexOf(card.rank)
}

function playFallbackCard(
    state: GameState,
    legalCards: TarotCard[],
): GameState {
    const lowestCard = legalCards.reduce((lowest, card) =>
        getFallbackCardValue(card) < getFallbackCardValue(lowest)
            ? card
            : lowest,
    )

    return playCard(state, lowestCard.id)
}

export function executeOpponentDecision(
    state: GameState,
    decision: OpponentDecision,
): GameState {
    if (state.isGameOver || state.activePlayerId !== 'opponent') {
        return state
    }

    const legalCards = getLegalCards(state)

    // If no card can be played, passing is the only fallback.
    if (legalCards.length === 0) {
        return passTurn(state)
    }

    if (decision.type === 'pass') {
        // Passing is not allowed before the first bid.
        // If the strategy wants to pass here, play a fallback card.
        if (state.playedCards.length === 0) {
            return playFallbackCard(state, legalCards)
        }

        return passTurn(state)
    }

    // Reject a strategy decision that attempts an illegal play.
    if (!legalCards.some((card) => card.id === decision.cardId)) {
        return state
    }

    return playCard(state, decision.cardId)
}
