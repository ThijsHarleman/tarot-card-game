import { getLegalCards } from '../../game'
import type { GameState } from '../../game'
import { MAJOR_ARCANA, RANKS } from '../../cards/card'
import type { TarotCard } from '../../cards/card'

export interface RoundEvaluation {
    readonly winDesirability: number
    readonly bidQuality: number
    readonly prizeValue: number
    readonly winningOpportunity: number
    readonly deckSustainability: number
}

const INITIAL_BID_QUALITY_WEIGHT = 0.4
const INITIAL_PRIZE_VALUE_WEIGHT = 0.0
const INITIAL_WINNING_OPPORTUNITY_WEIGHT = 0.6

const CARD_STRENGTH_EXPONENT = 2

// Card totals at or above this value are considered healthy.
const HEALTHY_CARD_COUNT = 14

// The AI should strongly prefer replenishing its cards at or below this value.
const MINIMUM_CARD_COUNT = 10

// Maximum reduction in win desirability caused by card depletion.
const MAX_DECK_SUSTAINABILITY_INFLUENCE = 0.5

function getCardStrength(card: TarotCard): number {
    if (card.kind === 'major') return 1

    return RANKS.indexOf(card.rank) / (RANKS.length - 1)
}

export function evaluateBidQuality(state: GameState): number {
    if (state.playedCards.length === 0) return 0.5

    const midpoint = (RANKS.length - 1) / 2

    const strongCards = state.playedCards.filter(card =>
        card.kind === 'major' ||
        RANKS.indexOf(card.rank) > midpoint,
    )

    return strongCards.length / state.playedCards.length
}

export function evaluatePrizeValue(state: GameState): number {
    return state.currentMajorArcana.number / (MAJOR_ARCANA.length - 1)
}

function evaluateWinningOpportunity(state: GameState): number {
    const opponentState: GameState = {
        ...state,
        activePlayerId: 'opponent',
    }

    const legalCards = getLegalCards(opponentState)

    const strongestCard = legalCards
        .filter(card => card.kind === 'major' || card.rank !== 'ace')
        .reduce(
            (strongest, card) =>
                Math.max(strongest, getCardStrength(card)),
            0,
        )

    const possibleBidValues = [
        ...RANKS.slice(1).map((_, index) => index + 1),
        ...MAJOR_ARCANA
            .slice(0, Math.floor(state.currentMajorArcana.number / 2))
            .map((_, index) => RANKS.length + index),
    ]

    const strongestPossibleValue =
        possibleBidValues[possibleBidValues.length - 1] ?? 1

    const strongestAvailableValue =
        Math.round(strongestCard * (RANKS.length - 1))

    const opportunity =
        strongestAvailableValue / strongestPossibleValue

    return Math.pow(Math.min(opportunity, 1), CARD_STRENGTH_EXPONENT)
}

function evaluateDeckSustainability(state: GameState): number {
    const availableCardCount =
        state.opponent.deck.length +
        state.opponent.hand.length +
        state.opponent.courtCards.length +
        state.opponent.discardPile.length

    if (availableCardCount >= HEALTHY_CARD_COUNT) return 0
    if (availableCardCount <= MINIMUM_CARD_COUNT) return 1

    return (
        (HEALTHY_CARD_COUNT - availableCardCount) /
        (HEALTHY_CARD_COUNT - MINIMUM_CARD_COUNT)
    )
}

export function evaluateRound(state: GameState): RoundEvaluation {
    const bidQuality = evaluateBidQuality(state)
    const prizeValue = evaluatePrizeValue(state)
    const winningOpportunity = evaluateWinningOpportunity(state)
    const deckSustainability = evaluateDeckSustainability(state)

    const progress =
        state.currentMajorArcana.number / (MAJOR_ARCANA.length - 1)

    const bidQualityWeight =
        INITIAL_BID_QUALITY_WEIGHT * (1 - progress)

    const winningOpportunityWeight =
        INITIAL_WINNING_OPPORTUNITY_WEIGHT * (1 - progress)

    const prizeValueWeight =
        INITIAL_PRIZE_VALUE_WEIGHT +
        (1 - INITIAL_PRIZE_VALUE_WEIGHT) * progress

    const baseWinDesirability =
        (1 - bidQuality) * bidQualityWeight +
        prizeValue * prizeValueWeight +
        winningOpportunity * winningOpportunityWeight

    // Sustainability encourages passing early, but matters less as the
    // game approaches its final prize.
    const sustainabilityInfluence =
        MAX_DECK_SUSTAINABILITY_INFLUENCE *
        deckSustainability *
        (1 - progress)

    const winDesirability = Math.max(
        0,
        Math.min(
            1,
            baseWinDesirability * (1 - sustainabilityInfluence),
        ),
    )

    return {
        winDesirability,
        bidQuality,
        prizeValue,
        winningOpportunity,
        deckSustainability,
    }
}
