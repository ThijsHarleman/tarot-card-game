import { describe, expect, it } from 'vitest'

import { generateStrategyConfig } from '../strategies/strategyConfig'
import { DEFAULT_GENERATION_OPTIONS } from '../strategies/strategyConfig'
import { mutateStrategy } from './mutateStrategy'
import type { StrategyConfig } from '../../src/game/opponent/strategic/config'

const parent: StrategyConfig = generateStrategyConfig(
    DEFAULT_GENERATION_OPTIONS,
    () => 0.5,
)

const noMutation = {
    mutationRate: 0,
    mutationStrength: 0.2,
}

const fullMutation = {
    mutationRate: 1,
    mutationStrength: 1,
}

describe('mutateStrategy', () => {
    it('preserves the parent configuration when mutation rate is zero', () => {
        const result = mutateStrategy(
            parent,
            noMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        expect(result).toEqual(parent)
    })

    it('returns a valid configuration when mutation rate is one', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        expect(result).toBeDefined()
        expect(result.roundEvaluation).toBeDefined()
        expect(result.passEvaluation).toBeDefined()
        expect(result.cardEvaluation).toBeDefined()
    })

    it('keeps all round weights within their configured ranges', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        const {
            bidQualityWeight,
            prizeValueWeight,
            winningOpportunityWeight,
        } = result.roundEvaluation

        expect(bidQualityWeight).toBeGreaterThanOrEqual(0)
        expect(bidQualityWeight).toBeLessThanOrEqual(1)

        expect(prizeValueWeight).toBeGreaterThanOrEqual(0)
        expect(prizeValueWeight).toBeLessThanOrEqual(1)

        expect(winningOpportunityWeight).toBeGreaterThanOrEqual(0)
        expect(winningOpportunityWeight).toBeLessThanOrEqual(1)
    })

    it('keeps the three round weights summing to one', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        const {
            bidQualityWeight,
            prizeValueWeight,
            winningOpportunityWeight,
        } = result.roundEvaluation

        expect(
            bidQualityWeight +
            prizeValueWeight +
            winningOpportunityWeight,
        ).toBeCloseTo(1, 10)
    })

    it('keeps minimumCardCount at or below healthyCardCount', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        expect(result.roundEvaluation.minimumCardCount).toBeLessThanOrEqual(
            result.roundEvaluation.healthyCardCount,
        )
    })

    it('keeps integer card counts within their configured ranges', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        const { healthyCardCount, minimumCardCount } = result.roundEvaluation

        expect(Number.isInteger(healthyCardCount)).toBe(true)
        expect(Number.isInteger(minimumCardCount)).toBe(true)

        expect(healthyCardCount).toBeGreaterThanOrEqual(
            DEFAULT_GENERATION_OPTIONS.roundEvaluation.healthyCardCount.min,
        )

        expect(healthyCardCount).toBeLessThanOrEqual(
            DEFAULT_GENERATION_OPTIONS.roundEvaluation.healthyCardCount.max,
        )

        expect(minimumCardCount).toBeGreaterThanOrEqual(
            DEFAULT_GENERATION_OPTIONS.roundEvaluation.minimumCardCount.min,
        )

        expect(minimumCardCount).toBeLessThanOrEqual(
            DEFAULT_GENERATION_OPTIONS.roundEvaluation.minimumCardCount.max,
        )
    })

    it('keeps numeric parameters within their configured ranges', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.5,
        )

        const { roundEvaluation, passEvaluation, cardEvaluation } = result

        expect(roundEvaluation.cardStrengthExponent).toBeGreaterThanOrEqual(0)
        expect(roundEvaluation.cardStrengthExponent).toBeLessThanOrEqual(10)

        expect(
            roundEvaluation.maxDeckSustainabilityInfluence,
        ).toBeGreaterThanOrEqual(0)

        expect(
            roundEvaluation.maxDeckSustainabilityInfluence,
        ).toBeLessThanOrEqual(1)

        for (const value of Object.values(passEvaluation)) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        }

        for (const value of Object.values(cardEvaluation)) {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        }
    })

    it('rejects a mutation rate below zero', () => {
        expect(() =>
            mutateStrategy(
                parent,
                { mutationRate: -0.1, mutationStrength: 0.2 },
            ),
        ).toThrow('Mutation rate must be between 0 and 1.')
    })

    it('rejects a mutation rate above one', () => {
        expect(() =>
            mutateStrategy(
                parent,
                { mutationRate: 1.1, mutationStrength: 0.2 },
            ),
        ).toThrow('Mutation rate must be between 0 and 1.')
    })

    it('rejects a mutation strength below zero', () => {
        expect(() =>
            mutateStrategy(
                parent,
                { mutationRate: 0.2, mutationStrength: -0.1 },
            ),
        ).toThrow('Mutation strength must be between 0 and 1.')
    })

    it('rejects a mutation strength above one', () => {
        expect(() =>
            mutateStrategy(
                parent,
                { mutationRate: 0.2, mutationStrength: 1.1 },
            ),
        ).toThrow('Mutation strength must be between 0 and 1.')
    })

    it('rejects a random function returning an invalid value', () => {
        expect(() =>
            mutateStrategy(
                parent,
                noMutation,
                DEFAULT_GENERATION_OPTIONS,
                () => 1,
            ),
        ).toThrow(
            'Random function must return a value from 0 to less than 1',
        )
    })

    it('always produces round weights that sum to exactly 1', () => {
        for (let index = 0; index < 100; index++) {
            const result = mutateStrategy(
                parent,
                fullMutation,
                DEFAULT_GENERATION_OPTIONS,
                Math.random,
            )

            const weights = result.roundEvaluation

            expect(
                weights.bidQualityWeight +
                weights.prizeValueWeight +
                weights.winningOpportunityWeight,
            ).toBeCloseTo(1, 10)
        }
    })

    it('keeps round weights within the range 0 to 1', () => {
        const result = mutateStrategy(
            parent,
            fullMutation,
            DEFAULT_GENERATION_OPTIONS,
            () => 0.75,
        )

        const weights = result.roundEvaluation

        expect(weights.bidQualityWeight).toBeGreaterThanOrEqual(0)
        expect(weights.bidQualityWeight).toBeLessThanOrEqual(1)

        expect(weights.prizeValueWeight).toBeGreaterThanOrEqual(0)
        expect(weights.prizeValueWeight).toBeLessThanOrEqual(1)

        expect(weights.winningOpportunityWeight).toBeGreaterThanOrEqual(0)
        expect(weights.winningOpportunityWeight).toBeLessThanOrEqual(1)
    })

    it('generates valid round weights across repeated mutations', () => {
        for (let index = 0; index < 500; index++) {
            const result = mutateStrategy(
                parent,
                fullMutation,
                DEFAULT_GENERATION_OPTIONS,
            )

            const weights = result.roundEvaluation

            expect(weights.bidQualityWeight).toBeGreaterThanOrEqual(0)
            expect(weights.prizeValueWeight).toBeGreaterThanOrEqual(0)
            expect(weights.winningOpportunityWeight).toBeGreaterThanOrEqual(0)

            expect(
                weights.bidQualityWeight +
                weights.prizeValueWeight +
                weights.winningOpportunityWeight,
            ).toBeCloseTo(1, 10)
        }
    })
})
