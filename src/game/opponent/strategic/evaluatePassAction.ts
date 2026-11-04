import type { GameState } from '../../game'
import { evaluateBidQuality, evaluatePrizeValue } from './evaluateRound'

const BID_ADVANTAGE_WEIGHT = 0.4
const WIN_DESIRE_WEIGHT = 1

export interface PassActionEvaluation {
    readonly bidQuality: number
    readonly prizeValue: number
    readonly winDesirability: number
    readonly bidAdvantage: number
    readonly passDesirability: number
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

export function evaluatePassAction(
    state: GameState,
    winDesirability: number,
): PassActionEvaluation {
    const bidQuality = evaluateBidQuality(state)
    const prizeValue = evaluatePrizeValue(state)

    const bidAdvantage = bidQuality - prizeValue

    const passDesirability = clamp(
        0.5 +
        bidAdvantage * BID_ADVANTAGE_WEIGHT -
        Math.max(0, winDesirability - 0.5) * WIN_DESIRE_WEIGHT,
        0,
        1,
    )

    return {
        bidQuality,
        prizeValue,
        winDesirability,
        bidAdvantage,
        passDesirability,
    }
}
