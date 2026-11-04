import { getLegalCards } from '../../game'
import type { GameState } from '../../game'
import type { TarotCard } from '../../cards/card'
import { RANKS } from '../../cards/card'

export interface CardActionEvaluation {
    readonly type: 'play'
    readonly card: TarotCard
    /** How well playing this card aligns with my goal for the round. */
    readonly strategicAlignment: number
    /** How costly it is to spend this card, from 0 to 1. */
    readonly opportunityCost: number
    /** Overall attractiveness of playing this card, from 0 to 1. */
    readonly score: number
}

const ALIGNMENT_WEIGHT = 0.7
const OPPORTUNITY_COST_WEIGHT = 0.3

function getCardValue(card: TarotCard): number {
    if (card.kind === 'major') return 1

    return RANKS.indexOf(card.rank) / (RANKS.length - 1)
}

function evaluateOpportunityCost(
    state: GameState,
    card: TarotCard,
): number {
    const activePlayer =
        state.activePlayerId === 'player'
            ? state.player
            : state.opponent

    // Court cards are limited resources, so prefer to preserve them.
    if (activePlayer.courtCards.some(
        (courtCard) => courtCard.id === card.id,
    )) {
        return 0.8
    }

    // Major Arcana are valuable resources.
    if (card.kind === 'major') {
        return 1
    }

    // Minor Arcana in the hand are comparatively expendable.
    return getCardValue(card) * 0.5
}

function evaluateStrategicAlignment(
    card: TarotCard,
    winDesirability: number,
): number {
    // Preserve the Ace's flexibility regardless of the current goal.
    if (card.kind === 'minor' && card.rank === 'ace') {
        return 0.1
    }

    const cardValue = getCardValue(card)

    if (winDesirability >= 0.5) {
        // When I want to win, prefer low cards.
        // High cards become more attractive when low cards are unavailable.
        return 1 - cardValue
    }

    // When I want to lose, prefer medium-to-high Minor Arcana cards.
    // Court cards and Major Arcana are deliberately not rewarded here.
    if (card.kind === 'major') return 0.1

    const isCourtCard = card.rank === 'page'
        || card.rank === 'knight'
        || card.rank === 'queen'
        || card.rank === 'king'

    if (isCourtCard) return 0.2

    // Peak preference around a medium-high bid rather than the maximum rank.
    const preferredValue = 0.65
    return Math.max(0, 1 - Math.abs(cardValue - preferredValue) / 0.65)
}

export function evaluateCardActions(
    state: GameState,
    winDesirability: number,
): CardActionEvaluation[] {
    if (state.isGameOver || state.activePlayerId !== 'opponent') {
        return []
    }

    const legalCards = getLegalCards(state)

    return legalCards
        .map((card): CardActionEvaluation => {
            const strategicAlignment = evaluateStrategicAlignment(
                card,
                winDesirability,
            )

            const opportunityCost = evaluateOpportunityCost(state, card)

            const score =
                strategicAlignment * ALIGNMENT_WEIGHT +
                (1 - opportunityCost) * OPPORTUNITY_COST_WEIGHT

            return {
                type: 'play',
                card,
                strategicAlignment,
                opportunityCost,
                score,
            }
        })
        .sort((a, b) => b.score - a.score)
}
