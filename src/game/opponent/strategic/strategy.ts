import { canPlayCard } from '../../cardRank'
import type { GameState } from '../../game'
import type { OpponentDecision, OpponentStrategy } from '../strategy'
import { evaluateRound } from './evaluateRound'
import { evaluatePassAction } from './evaluatePassAction'
import { evaluateCardActions } from './evaluateCardActions'
import { filterCardActions } from './filterActions'
import { selectWeighted } from './selectWeighted'

const COURT_RANKS = ['page', 'knight', 'queen', 'king'] as const

function canPassStrategically(state: GameState): boolean {
    const previousCard = state.playedCards.at(-1)

    // Don't pass if we have a legal non-Ace Minor Arcana in hand.
    const hasLegalMinorArcanaInHand = state.opponent.hand.some(card =>
        card.kind === 'minor' &&
        card.rank !== 'ace' &&
        canPlayCard(card, previousCard),
    )

    if (hasLegalMinorArcanaInHand) {
        return false
    }

    // Court cards are worth preserving against other court cards
    // and Major Arcana, but should be used against lower bids.
    const previousCardIsBelowCourt =
        previousCard?.kind === 'minor' &&
        !COURT_RANKS.includes(
            previousCard.rank as typeof COURT_RANKS[number],
        )

    if (!previousCardIsBelowCourt) {
        return true
    }

    const hasLegalCourtCard = state.opponent.courtCards.some(card =>
        card.kind === 'minor' &&
        COURT_RANKS.includes(
            card.rank as typeof COURT_RANKS[number],
        ) &&
        canPlayCard(card, previousCard),
    )

    return !hasLegalCourtCard
}

export const strategicStrategy: OpponentStrategy = {
    name: 'Strategic',

    chooseAction(state: GameState): OpponentDecision {
        try {
            const { winDesirability } = evaluateRound(state)

            const passEvaluation = evaluatePassAction(
                state,
                winDesirability,
            )

            const canPass = canPassStrategically(state)

            const shouldPass = canPass && selectWeighted([
                {
                    value: true,
                    weight: passEvaluation.passDesirability,
                },
                {
                    value: false,
                    weight: 1 - passEvaluation.passDesirability,
                },
            ])

            if (shouldPass) {
                return { type: 'pass' }
            }

            const cardEvaluations = evaluateCardActions(
                state,
                winDesirability,
            )

            if (cardEvaluations.length === 0) {
                return { type: 'pass' }
            }

            const acceptableCards = filterCardActions(
                state,
                cardEvaluations,
            )

            if (acceptableCards.length === 0) {
                return { type: 'pass' }
            }

            const selectedCard = selectWeighted(
                acceptableCards.map(evaluation => ({
                    value: evaluation.card,
                    weight: evaluation.score,
                })),
            )

            return {
                type: 'play',
                cardId: selectedCard.id,
            }
        } catch (error) {
            return { type: 'pass' }
        }
    }
}
