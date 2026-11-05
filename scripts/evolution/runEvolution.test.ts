import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateStrategyConfig } from '../strategies/strategyConfig'
import { runEvolution } from './runEvolution'
import type { EvolutionConfig } from './evolutionConfig'

const evolutionConfig: EvolutionConfig = {
    populationSize: 6,
    eliteCount: 1,
    parentPoolSize: 2,
    randomStrategyCount: 1,
    mutationRate: 0.5,
    mutationStrength: 0.2,
}

describe('runEvolution', () => {
    let outputDirectory: string

    beforeEach(async () => {
        outputDirectory = await mkdtemp(resolve(tmpdir(), 'tarot-evolution-'))

        const generationPath = resolve(outputDirectory, 'generation_1')
        await mkdir(generationPath, { recursive: true })

        const strategies = Array.from({ length: 4 }, (_, index) => ({
            name: `strategy_${index + 1}`,
            config: generateStrategyConfig(undefined, () => 0.5),
        }))

        await writeFile(
            resolve(generationPath, 'strategies.json'),
            JSON.stringify(strategies, null, 2),
            'utf8',
        )

        const evaluation = {
            generationNumber: 1,
            strategiesEvaluated: 4,
            rankings: strategies.map(({ name }, index) => ({
                name,
                rank: index + 1,
            })),
        }

        await writeFile(
            resolve(generationPath, 'evaluation.json'),
            JSON.stringify(evaluation, null, 2),
            'utf8',
        )
    })

    afterEach(async () => {
        await rm(outputDirectory, { recursive: true, force: true })
    })

    it('creates the next generation snapshot', async () => {
        const result = await runEvolution({
            previousGenerationNumber: 1,
            outputDirectory,
            evolutionConfig,
            random: () => 0.5,
        })

        expect(result).toHaveLength(evolutionConfig.populationSize)

        const savedContent = await readFile(
            resolve(outputDirectory, 'generation_2', 'strategies.json'),
            'utf8',
        )

        const savedStrategies = JSON.parse(savedContent) as {
            name: string
            config: unknown
        }[]

        expect(savedStrategies).toHaveLength(evolutionConfig.populationSize)
        expect(savedStrategies[0].name).toBe('strategy_1')
        expect(savedStrategies[5].name).toBe('strategy_6')
        expect(savedStrategies.every(({ config }) => config !== undefined)).toBe(true)
    })

    it('does not modify the previous generation', async () => {
        const previousSnapshotPath = resolve(
            outputDirectory,
            'generation_1',
            'strategies.json',
        )

        const originalContent = await readFile(previousSnapshotPath, 'utf8')

        await runEvolution({
            previousGenerationNumber: 1,
            outputDirectory,
            evolutionConfig,
            random: () => 0.5,
        })

        const updatedContent = await readFile(previousSnapshotPath, 'utf8')

        expect(updatedContent).toBe(originalContent)
    })

    it('refuses to overwrite an existing next generation', async () => {
        const nextGenerationPath = resolve(outputDirectory, 'generation_2')
        await mkdir(nextGenerationPath)

        await expect(
            runEvolution({
                previousGenerationNumber: 1,
                outputDirectory,
                evolutionConfig,
                random: () => 0.5,
            }),
        ).rejects.toThrow('The next generation already exists')
    })

    it('rejects an evaluation for the wrong generation', async () => {
        const evaluationPath = resolve(
            outputDirectory,
            'generation_1',
            'evaluation.json',
        )

        await writeFile(
            evaluationPath,
            JSON.stringify({
                generationNumber: 2,
                strategiesEvaluated: 4,
                rankings: [],
            }),
            'utf8',
        )

        await expect(
            runEvolution({
                previousGenerationNumber: 1,
                outputDirectory,
                evolutionConfig,
                random: () => 0.5,
            }),
        ).rejects.toThrow('Evaluation is for generation 2, not generation 1.')
    })

    it('rejects an evaluation with missing rankings', async () => {
        const evaluationPath = resolve(
            outputDirectory,
            'generation_1',
            'evaluation.json',
        )

        await writeFile(
            evaluationPath,
            JSON.stringify({
                generationNumber: 1,
                strategiesEvaluated: 4,
                rankings: [],
            }),
            'utf8',
        )

        await expect(
            runEvolution({
                previousGenerationNumber: 1,
                outputDirectory,
                evolutionConfig,
                random: () => 0.5,
            }),
        ).rejects.toThrow('Evaluation rankings do not match the strategy snapshot.')
    })

    it('rejects an invalid previous generation number', async () => {
        await expect(
            runEvolution({
                previousGenerationNumber: 0,
                outputDirectory,
                evolutionConfig,
            }),
        ).rejects.toThrow(RangeError)
    })
})
