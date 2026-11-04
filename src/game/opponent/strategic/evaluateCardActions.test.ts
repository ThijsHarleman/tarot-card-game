import { describe, expect, it } from 'vitest'
import { evaluateCardActions } from './evaluateCardActions'
import { evaluateCardActionExamples } from './evaluateCardActionExamples'

describe('evaluateCardActions', () => {
  it.each(evaluateCardActionExamples)(
    '$name',
    ({ state, winDesirability, expectedBestCardId, description }) => {
      const evaluations = evaluateCardActions(
        state,
        winDesirability,
      )

      console.log(`\n${description}`)
      console.log(`Win desirability: ${winDesirability}`)

      console.table(
        evaluations.map((evaluation, index) => ({
          rank: index + 1,
          card:
            evaluation.card.kind === 'major'
              ? evaluation.card.name
              : `${evaluation.card.rank} of ${evaluation.card.suit}`,
          strategicAlignment: evaluation.strategicAlignment.toFixed(3),
          opportunityCost: evaluation.opportunityCost.toFixed(3),
          score: evaluation.score.toFixed(3),
        })),
      )

      // Every returned card should be legal, and at least one should exist.
      expect(evaluations.length).toBeGreaterThan(0)

      // The highest-scoring card should match our expected result.
      expect(evaluations[0].card.id).toBe(expectedBestCardId)

      // All scores should be within the expected range.
      for (const evaluation of evaluations) {
        expect(evaluation.score).toBeGreaterThanOrEqual(0)
        expect(evaluation.score).toBeLessThanOrEqual(1)
      }
    },
  )
})
