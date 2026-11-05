import { describe, expect, it } from 'vitest'
import { generateStrategyConfig } from '../strategies/strategyConfig'
import { evolveGeneration } from './evolveGeneration'
import type { StrategyEntry } from './evolveGeneration'
import type { RankedStrategy } from './selectParents'
import type { EvolutionConfig } from './evolutionConfig'

const populationSize = 10

const previousStrategies: StrategyEntry[] = Array.from(
    { length: populationSize },
    (_, index) => ({
        name: `strategy_${index + 1}`,
        config: generateStrategyConfig(undefined, () => 0.5),
    }),
)

const rankings: RankedStrategy[] = previousStrategies.map(
    ({ name }, index) => ({
        name,
        rank: index + 1,
    }),
)

const config: EvolutionConfig = {
    populationSize: 10,
    eliteCount: 2,
    parentPoolSize: 4,
    randomStrategyCount: 2,
    mutationRate: 0.5,
    mutationStrength: 0.2,
}

const fixedRandom = () => 0.5

describe('evolveGeneration', () => {
    it('creates a generation with the configured population size', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        expect(nextGeneration).toHaveLength(config.populationSize)
    })

    it('names strategies sequentially', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        expect(nextGeneration.map(({ name }) => name)).toEqual(
            Array.from(
                { length: config.populationSize },
                (_, index) => `strategy_${index + 1}`,
            ),
        )
    })

    it('preserves elite configurations unchanged', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        expect(nextGeneration[0].config).toBe(previousStrategies[0].config)
        expect(nextGeneration[1].config).toBe(previousStrategies[1].config)
    })

    it('creates the expected number of mutated offspring', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        const offspringCount =
            config.populationSize - config.eliteCount - config.randomStrategyCount

        expect(nextGeneration.slice(config.eliteCount, config.eliteCount + offspringCount))
            .toHaveLength(offspringCount)
    })

    it('adds the configured number of random strategies at the end', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        const randomStrategies = nextGeneration.slice(-config.randomStrategyCount)

        expect(randomStrategies).toHaveLength(config.randomStrategyCount)

        for (const strategy of randomStrategies) {
            expect(strategy.config).toBeDefined()
        }
    })

    it('produces valid strategy configurations', () => {
        const nextGeneration = evolveGeneration(
            previousStrategies,
            rankings,
            config,
            undefined,
            fixedRandom,
        )

        for (const strategy of nextGeneration) {
            expect(strategy.config.roundEvaluation.bidQualityWeight).toBeGreaterThanOrEqual(0)
            expect(strategy.config.roundEvaluation.prizeValueWeight).toBeGreaterThanOrEqual(0)
            expect(strategy.config.roundEvaluation.winningOpportunityWeight).toBeGreaterThanOrEqual(0)

            const weights = strategy.config.roundEvaluation

            expect(
                weights.bidQualityWeight +
                weights.prizeValueWeight +
                weights.winningOpportunityWeight,
            ).toBeCloseTo(1, 10)

            expect(weights.minimumCardCount).toBeLessThanOrEqual(
                weights.healthyCardCount,
            )
        }
    })

    it('rejects a parent pool larger than the previous population', () => {
        expect(() =>
            evolveGeneration(
                previousStrategies,
                rankings,
                { ...config, parentPoolSize: populationSize + 1 },
                undefined,
                fixedRandom,
            ),
        ).toThrow(RangeError)
    })

    it('rejects elite and random counts exceeding the population', () => {
        expect(() =>
            evolveGeneration(
                previousStrategies,
                rankings,
                { ...config, eliteCount: 6, randomStrategyCount: 5 },
                undefined,
                fixedRandom,
            ),
        ).toThrow(RangeError)
    })

    it('rejects a mutation rate outside the range 0 to 1', () => {
        expect(() =>
            evolveGeneration(
                previousStrategies,
                rankings,
                { ...config, mutationRate: 1.1 },
                undefined,
                fixedRandom,
            ),
        ).toThrow(RangeError)
    })

    it('rejects a mutation strength outside the range 0 to 1', () => {
        expect(() =>
            evolveGeneration(
                previousStrategies,
                rankings,
                { ...config, mutationStrength: -0.1 },
                undefined,
                fixedRandom,
            ),
        ).toThrow(RangeError)
    })
})
