import { describe, expect, it } from 'vitest'
import { evaluatePassAction } from './evaluatePassAction'
import { evaluatePassActionExamples } from './evaluatePassActionExamples'

describe('evaluatePassAction', () => {
    it.each(evaluatePassActionExamples)(
        '$name',
        ({
            state,
            winDesirability,
            minPassDesirability,
            maxPassDesirability,
            description,
        }) => {
            const evaluation = evaluatePassAction(
                state,
                winDesirability,
            )

            console.log(`\n${description}`)

            console.table([
                {
                    bidQuality: evaluation.bidQuality.toFixed(3),
                    prizeValue: evaluation.prizeValue.toFixed(3),
                    winDesirability: evaluation.winDesirability.toFixed(3),
                    passDesirability: evaluation.passDesirability.toFixed(3),
                    expectedMin: minPassDesirability.toFixed(3),
                    expectedMax: maxPassDesirability.toFixed(3),
                },
            ])

            expect(evaluation.passDesirability).toBeGreaterThanOrEqual(
                minPassDesirability,
            )

            expect(evaluation.passDesirability).toBeLessThanOrEqual(
                maxPassDesirability,
            )
        },
    )
})
