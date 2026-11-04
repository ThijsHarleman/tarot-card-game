
import { describe, expect, it } from 'vitest'
import { evaluateRound } from './evaluateRound'
import { roundEvaluationExamples } from './evaluateRoundExamples'

describe('round evaluation examples', () => {
    it.each(roundEvaluationExamples)(
        '$name: win desirability is within the expected range',
        (example) => {
            const evaluation = evaluateRound(example.state)

            expect(evaluation.winDesirability).toBeGreaterThanOrEqual(
                example.minWinDesirability,
            )

            expect(evaluation.winDesirability).toBeLessThanOrEqual(
                example.maxWinDesirability,
            )
        },
    )

    it('prints a report for reviewing all example evaluations', () => {
        const results = roundEvaluationExamples.map((example) => {
            const evaluation = evaluateRound(example.state)

            return {
                name: example.name,
                minExpected: example.minWinDesirability,
                winDesirability: Number(evaluation.winDesirability.toFixed(3)),
                maxExpected: example.maxWinDesirability,
                bidQuality: Number(evaluation.bidQuality.toFixed(3)),
                prizeValue: Number(evaluation.prizeValue.toFixed(3)),
                winningOpportunity: Number(
                    evaluation.winningOpportunity.toFixed(3),
                ),
                deckSustainability: Number(
                    evaluation.deckSustainability.toFixed(3),
                ),
            }
        })

        console.table(results)
    })

    it('scores a weak bid as more desirable to win than a strong bid', () => {
        const weakBid = roundEvaluationExamples.find(
            (example) => example.name === 'Collectively weak bid',
        )
        const strongBid = roundEvaluationExamples.find(
            (example) => example.name === 'Collectively strong bid',
        )

        expect(weakBid).toBeDefined()
        expect(strongBid).toBeDefined()

        expect(
            evaluateRound(weakBid!.state).winDesirability,
        ).toBeGreaterThan(
            evaluateRound(strongBid!.state).winDesirability,
        )
    })

    it('recognizes that no legal response means no winning opportunity', () => {
        const example = roundEvaluationExamples.find(
            (item) => item.name === 'No legal response',
        )

        expect(example).toBeDefined()
        expect(evaluateRound(example!.state).winningOpportunity).toBe(0)
    })
})
