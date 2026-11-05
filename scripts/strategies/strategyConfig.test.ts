import { describe, expect, it } from 'vitest'
import { generateStrategyConfig } from './strategyConfig'
import { DEFAULT_GENERATION_OPTIONS } from './strategyConfig'

describe('generateStrategyConfig', () => {
    it('generates valid configurations within the default ranges', () => {
        for (let index = 0; index < 1000; index += 1) {
            const config = generateStrategyConfig()

            const round = config.roundEvaluation

            expect(
                round.bidQualityWeight +
                round.prizeValueWeight +
                round.winningOpportunityWeight,
            ).toBeCloseTo(1, 10)

            expect(round.cardStrengthExponent).toBeGreaterThanOrEqual(0)
            expect(round.cardStrengthExponent).toBeLessThanOrEqual(10)

            expect(round.healthyCardCount).toBeGreaterThanOrEqual(0)
            expect(round.healthyCardCount).toBeLessThanOrEqual(20)

            expect(round.minimumCardCount).toBeGreaterThanOrEqual(0)
            expect(round.minimumCardCount).toBeLessThanOrEqual(
                round.healthyCardCount,
            )

            expect(round.maxDeckSustainabilityInfluence).toBeGreaterThanOrEqual(0)
            expect(round.maxDeckSustainabilityInfluence).toBeLessThanOrEqual(1)

            for (const value of [
                config.passEvaluation.bidAdvantageWeight,
                config.passEvaluation.winDesireWeight,
                config.cardEvaluation.alignmentWeight,
                config.cardEvaluation.opportunityCostWeight,
                config.cardEvaluation.winDesirabilityThreshold,
                config.cardEvaluation.preferredLosingBidValue,
                config.cardEvaluation.aceAlignment,
                config.cardEvaluation.majorArcanaLosingAlignment,
                config.cardEvaluation.courtCardLosingAlignment,
                config.cardEvaluation.courtCardOpportunityCost,
                config.cardEvaluation.majorArcanaOpportunityCost,
                config.cardEvaluation.minorArcanaOpportunityCostFactor,
            ]) {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            }
        }
    })

    it('respects configured ranges and precision', () => {
        const config = generateStrategyConfig({
            roundEvaluation: {
                bidQualityWeight: { min: 0.2, max: 0.5 },
                prizeValueWeight: { min: 0.1, max: 0.3 },
                winningOpportunityWeight: { min: 0.3, max: 0.7 },
                weightPrecision: 3,

                cardStrengthExponent: {
                    min: 3,
                    max: 4,
                    precision: 1,
                },
                healthyCardCount: { min: 12, max: 16 },
                minimumCardCount: { min: 5, max: 10 },
                maxDeckSustainabilityInfluence: {
                    min: 0.2,
                    max: 0.4,
                    precision: 2,
                },
            },
            passEvaluation: {
                bidAdvantageWeight: { min: 0.2, max: 0.4, precision: 2 },
                winDesireWeight: { min: 0.5, max: 0.7, precision: 2 },
            },
            cardEvaluation: {
                alignmentWeight: { min: 0.3, max: 0.5, precision: 2 },
                opportunityCostWeight: { min: 0.1, max: 0.3, precision: 2 },
                winDesirabilityThreshold: { min: 0.4, max: 0.6, precision: 2 },
                preferredLosingBidValue: { min: 0.6, max: 0.8, precision: 2 },
                aceAlignment: { min: 0, max: 0.2, precision: 2 },
                majorArcanaLosingAlignment: { min: 0, max: 0.2, precision: 2 },
                courtCardLosingAlignment: { min: 0.1, max: 0.3, precision: 2 },
                courtCardOpportunityCost: { min: 0.7, max: 0.9, precision: 2 },
                majorArcanaOpportunityCost: { min: 0.8, max: 1, precision: 2 },
                minorArcanaOpportunityCostFactor: { min: 0.3, max: 0.5, precision: 2 },
            },
        })

        expect(config.roundEvaluation.cardStrengthExponent).toBeGreaterThanOrEqual(3)
        expect(config.roundEvaluation.cardStrengthExponent).toBeLessThanOrEqual(4)

        expect(config.roundEvaluation.healthyCardCount).toBeGreaterThanOrEqual(12)
        expect(config.roundEvaluation.healthyCardCount).toBeLessThanOrEqual(16)

        expect(config.roundEvaluation.minimumCardCount).toBeLessThanOrEqual(
            config.roundEvaluation.healthyCardCount,
        )

        expect(
            config.roundEvaluation.bidQualityWeight +
            config.roundEvaluation.prizeValueWeight +
            config.roundEvaluation.winningOpportunityWeight,
        ).toBe(1)
    })

    it('rejects impossible round weight ranges', () => {
        expect(() => generateStrategyConfig({
            ...DEFAULT_GENERATION_OPTIONS,
            roundEvaluation: {
                ...DEFAULT_GENERATION_OPTIONS.roundEvaluation,
                bidQualityWeight: { min: 0.8, max: 1 },
                prizeValueWeight: { min: 0.8, max: 1 },
                winningOpportunityWeight: { min: 0, max: 1 },
            },
        })).toThrow('Round weight ranges cannot sum to 1')
    })
})
