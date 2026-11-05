import { getLegalCards } from '../../game'
import type { GameState } from '../../game'
import type { TarotCard } from '../../cards/card'
import { RANKS } from '../../cards/card'
import {
    DEFAULT_STRATEGY_CONFIG,
    type StrategyConfig,
} from './config'

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

function getCardValue(
    card: TarotCard,
    state: GameState,
): number {
    if (card.kind === 'major') {
        const maximumUsefulMajorNumber =
            state.currentMajorArcana.number / 2

        return Math.min(
            card.number / Math.max(maximumUsefulMajorNumber, 1),
            1,
        )
    }

    return RANKS.indexOf(card.rank) / (RANKS.length - 1)
}

function evaluateOpportunityCost(
    state: GameState,
    card: TarotCard,
    config: StrategyConfig,
): number {
    const {
        courtCardOpportunityCost,
        majorArcanaOpportunityCost,
        minorArcanaOpportunityCostFactor,
    } = config.cardEvaluation

    const activePlayer =
        state.activePlayerId === 'player'
            ? state.player
            : state.opponent

    // Court cards are limited resources, so prefer to preserve them.
    if (activePlayer.courtCards.some(
        courtCard => courtCard.id === card.id,
    )) {
        return courtCardOpportunityCost
    }

    // Major Arcana are valuable resources.
    if (card.kind === 'major') {
        return majorArcanaOpportunityCost
    }

    // Minor Arcana in the hand are comparatively expendable.
    return getCardValue(card, state) *
        minorArcanaOpportunityCostFactor
}

function evaluateStrategicAlignment(
    card: TarotCard,
    state: GameState,
    winDesirability: number,
    config: StrategyConfig,
): number {
    const {
        winDesirabilityThreshold,
        preferredLosingBidValue,
        aceAlignment,
        majorArcanaLosingAlignment,
        courtCardLosingAlignment,
    } = config.cardEvaluation

    // Preserve the Ace's flexibility regardless of the current goal.
    if (card.kind === 'minor' && card.rank === 'ace') {
        return aceAlignment
    }

    const cardValue = getCardValue(card, state)

    if (winDesirability >= winDesirabilityThreshold) {
        // When I want to win, prefer low cards.
        return 1 - cardValue
    }

    // When I want to lose, prefer medium-to-high Minor Arcana cards.
    if (card.kind === 'major') {
        return majorArcanaLosingAlignment
    }

    const isCourtCard =
        card.rank === 'page' ||
        card.rank === 'knight' ||
        card.rank === 'queen' ||
        card.rank === 'king'

    if (isCourtCard) {
        return courtCardLosingAlignment
    }

    // Peak preference around a medium-high bid rather than the maximum rank.
    return Math.max(
        0,
        1 - Math.abs(cardValue - preferredLosingBidValue) /
            preferredLosingBidValue,
    )
}

export function evaluateCardActions(
    state: GameState,
    winDesirability: number,
    config: StrategyConfig = DEFAULT_STRATEGY_CONFIG,
): CardActionEvaluation[] {
    if (state.isGameOver || state.activePlayerId !== 'opponent') {
        return []
    }

    const {
        alignmentWeight,
        opportunityCostWeight,
    } = config.cardEvaluation

    const legalCards = getLegalCards(state)

    return legalCards
        .map((card): CardActionEvaluation => {
            const strategicAlignment = evaluateStrategicAlignment(
                card,
                state,
                winDesirability,
                config,
            )

            const opportunityCost = evaluateOpportunityCost(
                state,
                card,
                config,
            )

            const score =
                strategicAlignment * alignmentWeight +
                (1 - opportunityCost) * opportunityCostWeight

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
