import type { GameState } from '../../game'
import { evaluateBidQuality, evaluatePrizeValue } from './evaluateRound'
import {
    DEFAULT_STRATEGY_CONFIG,
    type StrategyConfig,
} from './config'

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
    config: StrategyConfig = DEFAULT_STRATEGY_CONFIG,
): PassActionEvaluation {
    const {
        bidAdvantageWeight,
        winDesireWeight,
    } = config.passEvaluation

    const bidQuality = evaluateBidQuality(state)
    const prizeValue = evaluatePrizeValue(state)

    const bidAdvantage = bidQuality - prizeValue

    const passDesirability = clamp(
        0.5 +
        bidAdvantage * bidAdvantageWeight -
        Math.max(0, winDesirability - 0.5) * winDesireWeight,
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
