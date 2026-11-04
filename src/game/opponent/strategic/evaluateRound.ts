import { getLegalCards } from '../../game'
import type { GameState } from '../../game'
import { MAJOR_ARCANA, RANKS } from '../../cards/card'
import type { TarotCard } from '../../cards/card'

export interface RoundEvaluation {
    /** 0 = prefer losing, 1 = prefer winning. */
    readonly winDesirability: number

    /** A weak bid favors winning; a strong bid favors losing. */
    readonly bidQuality: number

    /** A more valuable prize favors winning. */
    readonly prizeValue: number

    /** Better available responses favor winning. */
    readonly winningOpportunity: number
}

const INITIAL_BID_QUALITY_WEIGHT = 0.4
const INITIAL_PRIZE_VALUE_WEIGHT = 0.0
const INITIAL_WINNING_OPPORTUNITY_WEIGHT = 0.6

const CARD_STRENGTH_EXPONENT = 2

/**
 * Returns a normalized strength score for a card.
 * Minor Arcana rank from Ace to King maps to 0–1.
 * Major Arcana ranks above Minor Arcana.
 */
function getCardStrength(card: TarotCard): number {
    if (card.kind === 'major') {
        return 1
    }

    const rankIndex = RANKS.indexOf(card.rank)

    return rankIndex / (RANKS.length - 1)
}

/**
 * Estimates how undesirable the current bid is to receive.
 * A high score means the bid contains mostly strong cards.
 */
export function evaluateBidQuality(state: GameState): number {
    if (state.playedCards.length === 0) {
        return 0.5
    }

    const midpoint = (RANKS.length - 1) / 2

    const strongCards = state.playedCards.filter((card) => {
        if (card.kind === 'major') {
            return true
        }

        return RANKS.indexOf(card.rank) > midpoint
    }).length

    return strongCards / state.playedCards.length
}

/**
 * Estimates the strategic value of the current Major Arcana prize.
 */
export function evaluatePrizeValue(state: GameState): number {
    const maxNumber = 21

    return state.currentMajorArcana.number / maxNumber
}

/**
 * Returns a normalized, exponential winning-opportunity score.
 *
 * Considers unique Minor Arcana ranks from Two through King, plus
 * Major Arcana whose number is at most half the current prize number.
 * Ace is excluded because it cannot independently win a round.
 */
function evaluateWinningOpportunity(state: GameState): number {
    const opponentState: GameState = {
        ...state,
        activePlayerId: 'opponent',
    }

    const legalCards = getLegalCards(opponentState)

    if (legalCards.length === 0) return 0

    const strongestCard = legalCards.reduce<TarotCard | null>(
        (strongest, card) => {
            if (card.kind === 'minor' && card.rank === 'ace') {
                return strongest
            }

            if (strongest === null) return card

            return getCardStrength(card) > getCardStrength(strongest)
                ? card
                : strongest
        },
        null,
    )

    if (strongestCard === null) return 0

    const prizeNumber = state.currentMajorArcana.number

    // Build the range of distinct, plausible bid strengths.
    const possibleBidValues: number[] = [
        ...RANKS
            .filter((rank) => rank !== 'ace')
            .map((rank) => RANKS.indexOf(rank)),
        ...MAJOR_ARCANA
            .map((_, index) => index)
            .filter((number) => number <= prizeNumber / 2)
            .map((number) => RANKS.length + number),
    ]

    const strongestValue =
        strongestCard.kind === 'major'
            ? RANKS.length + strongestCard.number
            : RANKS.indexOf(strongestCard.rank)

    const strongestPosition = possibleBidValues.filter(
        (value) => value <= strongestValue,
    ).length

    const normalizedPosition =
        strongestPosition / possibleBidValues.length

    return normalizedPosition ** CARD_STRENGTH_EXPONENT
}

export function evaluateRound(state: GameState): RoundEvaluation {
    const bidQuality = evaluateBidQuality(state)
    const prizeValue = evaluatePrizeValue(state)
    const winningOpportunity = evaluateWinningOpportunity(state)

    // Normalize the prize number to a range from 0 to 1.
    const progress = state.currentMajorArcana.number / 21

    // Gradually shift all weight towards the prize value.
    const bidQualityWeight =
        INITIAL_BID_QUALITY_WEIGHT * (1 - progress)

    const winningOpportunityWeight =
        INITIAL_WINNING_OPPORTUNITY_WEIGHT * (1 - progress)

    const prizeValueWeight =
        INITIAL_PRIZE_VALUE_WEIGHT +
        (1 - INITIAL_PRIZE_VALUE_WEIGHT) * progress

    const winDesirability =
        (1 - bidQuality) * bidQualityWeight +
        prizeValue * prizeValueWeight +
        winningOpportunity * winningOpportunityWeight

    return {
        winDesirability,
        bidQuality,
        prizeValue,
        winningOpportunity,
    }
}
