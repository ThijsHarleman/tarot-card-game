import { getLegalCards } from '../../game'
import type { GameState } from '../../game'
import { MAJOR_ARCANA, RANKS } from '../../cards/card'
import type { TarotCard } from '../../cards/card'
import {
    DEFAULT_STRATEGY_CONFIG,
    type StrategyConfig,
} from './config'

export interface RoundEvaluation {
    readonly winDesirability: number
    readonly bidQuality: number
    readonly prizeValue: number
    readonly winningOpportunity: number
    readonly deckSustainability: number
}

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

function evaluateWinningOpportunity(
    state: GameState,
    config: StrategyConfig,
): number {
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

    return Math.pow(
        Math.min(opportunity, 1),
        config.roundEvaluation.cardStrengthExponent,
    )
}

function evaluateDeckSustainability(
    state: GameState,
    config: StrategyConfig,
): number {
    const availableCardCount =
        state.opponent.deck.length +
        state.opponent.hand.length +
        state.opponent.courtCards.length +
        state.opponent.discardPile.length

    const {
        healthyCardCount,
        minimumCardCount,
    } = config.roundEvaluation

    if (availableCardCount >= healthyCardCount) return 0
    if (availableCardCount <= minimumCardCount) return 1

    return (
        (healthyCardCount - availableCardCount) /
        (healthyCardCount - minimumCardCount)
    )
}

export function evaluateRound(
    state: GameState,
    config: StrategyConfig = DEFAULT_STRATEGY_CONFIG,
): RoundEvaluation {
    const {
        bidQualityWeight: initialBidQualityWeight,
        prizeValueWeight: initialPrizeValueWeight,
        winningOpportunityWeight: initialWinningOpportunityWeight,
        maxDeckSustainabilityInfluence,
    } = config.roundEvaluation

    const bidQuality = evaluateBidQuality(state)
    const prizeValue = evaluatePrizeValue(state)
    const winningOpportunity = evaluateWinningOpportunity(state, config)
    const deckSustainability = evaluateDeckSustainability(state, config)

    const progress =
        state.currentMajorArcana.number / (MAJOR_ARCANA.length - 1)

    const bidQualityWeight =
        initialBidQualityWeight * (1 - progress)

    const winningOpportunityWeight =
        initialWinningOpportunityWeight * (1 - progress)

    const prizeValueWeight =
        initialPrizeValueWeight +
        (1 - initialPrizeValueWeight) * progress

    const baseWinDesirability =
        (1 - bidQuality) * bidQualityWeight +
        prizeValue * prizeValueWeight +
        winningOpportunity * winningOpportunityWeight

    const sustainabilityInfluence =
        maxDeckSustainabilityInfluence *
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
