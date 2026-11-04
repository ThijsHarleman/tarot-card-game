import type { GameState } from '../../game'
import type { OpponentDecision, OpponentStrategy } from '../strategy'
import { evaluateRound } from './evaluateRound'
import { evaluatePassAction } from './evaluatePassAction'
import { evaluateCardActions } from './evaluateCardActions'
import { selectWeighted } from './selectWeighted'

export const strategicStrategy: OpponentStrategy = {
    name: 'Strategic',

    chooseAction(state: GameState): OpponentDecision {
        const { winDesirability } = evaluateRound(state)

        const passEvaluation = evaluatePassAction(
            state,
            winDesirability,
        )

        const shouldPass = selectWeighted([
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

        const selectedCard = selectWeighted(
            cardEvaluations.map(evaluation => ({
                value: evaluation.card,
                weight: evaluation.score,
            })),
        )

        return {
            type: 'play',
            cardId: selectedCard.id,
        }
    }
}
