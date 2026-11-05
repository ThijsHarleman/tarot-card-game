
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

export function executeDecision(
    state: GameState,
    decision: OpponentDecision,
    activePlayerId: GameState['activePlayerId'],
): GameState {
    if (state.isGameOver || state.activePlayerId !== activePlayerId) {
        return state
    }

    const legalCards = getLegalCards(state)

    if (legalCards.length === 0) {
        return passTurn(state)
    }

    if (decision.type === 'pass') {
        if (state.playedCards.length === 0) {
            return playFallbackCard(state, legalCards)
        }

        return passTurn(state)
    }

    if (!legalCards.some((card) => card.id === decision.cardId)) {
        return state
    }

    return playCard(state, decision.cardId)
}

export function executeOpponentDecision(
    state: GameState,
    decision: OpponentDecision,
): GameState {
    return executeDecision(state, decision, 'opponent')
}
