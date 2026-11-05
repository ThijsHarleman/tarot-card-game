import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { createInitialGeneration } from './createInitialGeneration'

describe('createInitialGeneration', () => {
    let outputDirectory: string

    beforeEach(async () => {
        outputDirectory = await mkdtemp(
            resolve(tmpdir(), 'tarot-initial-generation-test-'),
        )
    })

    afterEach(async () => {
        await rm(outputDirectory, { recursive: true, force: true })
    })

    it('creates the requested number of randomly generated strategies', async () => {
        const populationSize = 5

        const strategies = await createInitialGeneration({
            populationSize,
            outputDirectory,
            random: () => 0.5,
        })

        expect(strategies).toHaveLength(populationSize)

        expect(strategies.map(strategy => strategy.name)).toEqual([
            'strategy_1',
            'strategy_2',
            'strategy_3',
            'strategy_4',
            'strategy_5',
        ])

        for (const strategy of strategies) {
            expect(strategy.config).toBeDefined()
            expect(strategy.config.roundEvaluation).toBeDefined()
            expect(strategy.config.passEvaluation).toBeDefined()
            expect(strategy.config.cardEvaluation).toBeDefined()
        }
    })

    it('saves the generated strategies to generation_1/strategies.json', async () => {
        const strategies = await createInitialGeneration({
            populationSize: 3,
            outputDirectory,
            random: () => 0.5,
        })

        const strategiesPath = resolve(
            outputDirectory,
            'generation_1',
            'strategies.json',
        )

        const savedContent = await readFile(strategiesPath, 'utf8')
        const savedStrategies = JSON.parse(savedContent)

        expect(savedStrategies).toEqual(strategies)
    })

    it('creates a valid initial population with round weights summing to one', async () => {
        const strategies = await createInitialGeneration({
            populationSize: 10,
            outputDirectory,
            random: Math.random,
        })

        for (const strategy of strategies) {
            const {
                bidQualityWeight,
                prizeValueWeight,
                winningOpportunityWeight,
            } = strategy.config.roundEvaluation

            expect(
                bidQualityWeight +
                prizeValueWeight +
                winningOpportunityWeight,
            ).toBeCloseTo(1, 10)

            expect(
                strategy.config.roundEvaluation.minimumCardCount,
            ).toBeLessThanOrEqual(
                strategy.config.roundEvaluation.healthyCardCount,
            )
        }
    })

    it('rejects a population size that is not a positive integer', async () => {
        await expect(
            createInitialGeneration({
                populationSize: 0,
                outputDirectory,
            }),
        ).rejects.toThrow('Population size must be a positive integer.')

        await expect(
            createInitialGeneration({
                populationSize: 1.5,
                outputDirectory,
            }),
        ).rejects.toThrow('Population size must be a positive integer.')
    })

    it('does not overwrite an existing generation_1 directory', async () => {
        await createInitialGeneration({
            populationSize: 2,
            outputDirectory,
            random: () => 0.5,
        })

        await expect(
            createInitialGeneration({
                populationSize: 2,
                outputDirectory,
                random: () => 0.25,
            }),
        ).rejects.toThrow()
    })
})
