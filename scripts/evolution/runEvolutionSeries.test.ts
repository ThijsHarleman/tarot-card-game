import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({
    createInitialGeneration: vi.fn(),
    runEvolution: vi.fn(),
    runGeneration: vi.fn(),
    evaluateGeneration: vi.fn(),
    loadStrategies: vi.fn(),
}))

vi.mock('./createInitialGeneration', () => ({
    createInitialGeneration: mocks.createInitialGeneration,
}))

vi.mock('./runEvolution', () => ({
    runEvolution: mocks.runEvolution,
}))

vi.mock('../runGeneration', () => ({
    runGeneration: mocks.runGeneration,
}))

vi.mock('../evaluateGeneration', () => ({
    evaluateGeneration: mocks.evaluateGeneration,
}))

vi.mock('../strategies/loadStrategies', () => ({
    loadStrategies: mocks.loadStrategies,
}))

import { runEvolutionSeries } from './runEvolutionSeries'
import { createInitialGeneration } from './createInitialGeneration'
import { runEvolution } from './runEvolution'
import { runGeneration } from '../runGeneration'
import { evaluateGeneration } from '../evaluateGeneration'
import { loadStrategies } from '../strategies/loadStrategies'

describe('runEvolutionSeries', () => {
    let outputDirectory: string

    async function createGeneration(
        generationNumber: number,
        files: {
            strategies?: boolean
            results?: boolean
            evaluation?: boolean
        } = {},
    ): Promise<void> {
        const generationPath = resolve(
            outputDirectory,
            `generation_${generationNumber}`,
        )

        await mkdir(generationPath, { recursive: true })

        if (files.strategies) {
            await writeFile(
                resolve(generationPath, 'strategies.json'),
                '[]',
                'utf8',
            )
        }

        if (files.results) {
            await writeFile(
                resolve(generationPath, 'simulation-results.csv'),
                'mock results',
                'utf8',
            )
        }

        if (files.evaluation) {
            await writeFile(
                resolve(generationPath, 'evaluation.json'),
                JSON.stringify({
                    generationNumber,
                    strategiesEvaluated: 0,
                    rankings: [],
                }),
                'utf8',
            )
        }
    }

    beforeEach(async () => {
        outputDirectory = await mkdtemp(
            resolve(tmpdir(), 'tarot-evolution-test-'),
        )

        vi.mocked(createInitialGeneration).mockReset()
        vi.mocked(runEvolution).mockReset()
        vi.mocked(runGeneration).mockReset()
        vi.mocked(evaluateGeneration).mockReset()
        vi.mocked(loadStrategies).mockReset()

        vi.mocked(loadStrategies).mockResolvedValue([])

        vi.mocked(createInitialGeneration).mockImplementation(
            async ({ outputDirectory: directory }) => {
                const generationPath = resolve(
                    directory,
                    'generation_1',
                )

                await mkdir(generationPath, { recursive: true })

                await writeFile(
                    resolve(generationPath, 'strategies.json'),
                    '[]',
                    'utf8',
                )

                return []
            },
        )

        vi.mocked(runEvolution).mockImplementation(
            async ({ previousGenerationNumber, outputDirectory: directory }) => {
                const nextGenerationNumber = previousGenerationNumber + 1

                const generationPath = resolve(
                    directory ?? outputDirectory,
                    `generation_${nextGenerationNumber}`,
                )

                await mkdir(generationPath, { recursive: true })

                await writeFile(
                    resolve(generationPath, 'strategies.json'),
                    '[]',
                    'utf8',
                )

                return []
            },
        )

        vi.mocked(runGeneration).mockImplementation(
            async ({ generationNumber, outputDirectory: directory }) => {
                const generationPath = resolve(
                    directory ?? outputDirectory,
                    `generation_${generationNumber}`,
                )

                await mkdir(generationPath, { recursive: true })

                await writeFile(
                    resolve(generationPath, 'simulation-results.csv'),
                    'mock results',
                    'utf8',
                )

                return []
            },
        )

        vi.mocked(evaluateGeneration).mockImplementation(
            async ({ generationNumber, outputDirectory: directory }) => {
                const generationPath = resolve(
                    directory ?? outputDirectory,
                    `generation_${generationNumber}`,
                )

                await mkdir(generationPath, { recursive: true })

                const evaluation = {
                    generationNumber,
                    fitnessFormula: 'test',
                    strategiesEvaluated: 0,
                    gamesPerStrategy: 0,
                    rankings: [],
                }

                await writeFile(
                    resolve(generationPath, 'evaluation.json'),
                    JSON.stringify(evaluation),
                    'utf8',
                )

                return evaluation
            },
        )
    })

    afterEach(async () => {
        await rm(outputDirectory, { recursive: true, force: true })
    })

    it('creates a random initial population and completes the requested generations', async () => {
        await runEvolutionSeries({
            generationsToRun: 3,
            outputDirectory,
        })

        // Generation 1 is created randomly.
        expect(createInitialGeneration).toHaveBeenCalledTimes(1)
        expect(createInitialGeneration).toHaveBeenCalledWith(
            expect.objectContaining({
                populationSize: expect.any(Number),
                outputDirectory,
            }),
        )

        // All three generations are simulated and evaluated.
        expect(runGeneration).toHaveBeenCalledTimes(3)
        expect(evaluateGeneration).toHaveBeenCalledTimes(3)

        // Only generations 2 and 3 are evolved from their predecessors.
        expect(runEvolution).toHaveBeenCalledTimes(2)

        expect(runEvolution).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                previousGenerationNumber: 1,
                outputDirectory,
            }),
        )

        expect(runEvolution).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                previousGenerationNumber: 2,
                outputDirectory,
            }),
        )

        // Generation 3 should be the final generation.
        await expect(
            access(resolve(
                outputDirectory,
                'generation_3',
                'evaluation.json',
            )),
        ).resolves.toBeUndefined()
    })

    it('does not create a new initial population when generation 1 already exists', async () => {
        await createGeneration(1, {
            strategies: true,
            results: true,
            evaluation: true,
        })

        await runEvolutionSeries({
            generationsToRun: 1,
            outputDirectory,
        })

        expect(createInitialGeneration).not.toHaveBeenCalled()
        expect(runEvolution).not.toHaveBeenCalled()
        expect(runGeneration).not.toHaveBeenCalled()
        expect(evaluateGeneration).not.toHaveBeenCalled()
    })

    it('evaluates existing simulation results without simulating again', async () => {
        await createGeneration(1, {
            strategies: true,
            results: true,
        })

        await runEvolutionSeries({
            generationsToRun: 1,
            outputDirectory,
        })

        expect(createInitialGeneration).not.toHaveBeenCalled()
        expect(runGeneration).not.toHaveBeenCalled()

        expect(evaluateGeneration).toHaveBeenCalledTimes(1)
        expect(evaluateGeneration).toHaveBeenCalledWith(
            expect.objectContaining({ generationNumber: 1 }),
        )
    })

    it('resumes an existing generation with results but no evaluation', async () => {
        await createGeneration(1, {
            strategies: true,
            evaluation: true,
        })

        await createGeneration(2, {
            strategies: true,
            results: true,
        })

        await runEvolutionSeries({
            generationsToRun: 2,
            outputDirectory,
        })

        expect(createInitialGeneration).not.toHaveBeenCalled()
        expect(runEvolution).not.toHaveBeenCalled()
        expect(runGeneration).not.toHaveBeenCalled()

        expect(evaluateGeneration).toHaveBeenCalledTimes(1)
        expect(evaluateGeneration).toHaveBeenCalledWith(
            expect.objectContaining({ generationNumber: 2 }),
        )
    })

    it('resumes an existing generation that has not yet been simulated', async () => {
        await createGeneration(1, {
            strategies: true,
            evaluation: true,
        })

        await createGeneration(2, {
            strategies: true,
        })

        await runEvolutionSeries({
            generationsToRun: 2,
            outputDirectory,
        })

        expect(createInitialGeneration).not.toHaveBeenCalled()
        expect(runEvolution).not.toHaveBeenCalled()

        expect(runGeneration).toHaveBeenCalledTimes(1)
        expect(evaluateGeneration).toHaveBeenCalledTimes(1)

        expect(runGeneration).toHaveBeenCalledWith(
            expect.objectContaining({ generationNumber: 2 }),
        )
    })

    it('rejects an invalid number of generations', async () => {
        await expect(
            runEvolutionSeries({
                generationsToRun: 0,
                outputDirectory,
            }),
        ).rejects.toThrow(
            'Number of generations to run must be a positive integer.',
        )

        expect(createInitialGeneration).not.toHaveBeenCalled()
    })

    it('rejects a non-integer number of generations', async () => {
        await expect(
            runEvolutionSeries({
                generationsToRun: 1.5,
                outputDirectory,
            }),
        ).rejects.toThrow(
            'Number of generations to run must be a positive integer.',
        )

        expect(createInitialGeneration).not.toHaveBeenCalled()
    })
})
