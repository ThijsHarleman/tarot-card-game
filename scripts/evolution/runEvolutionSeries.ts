import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createInitialGeneration } from './createInitialGeneration'
import { evaluateGeneration } from '../evaluateGeneration'
import { runGeneration } from '../runGeneration'
import { loadStrategies } from '../strategies/loadStrategies'

import { DEFAULT_EVOLUTION_CONFIG } from './evolutionConfig'
import type { EvolutionConfig } from './evolutionConfig'
import { runEvolution } from './runEvolution'

type Random = () => number

interface RunEvolutionSeriesOptions {
    readonly generationsToRun: number
    readonly outputDirectory?: string
    readonly evolutionConfig?: EvolutionConfig
    readonly random?: Random
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path)
        return true
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return false
        }

        throw error
    }
}

async function completeGeneration(
    generationNumber: number,
    outputDirectory: string,
    random: Random,
): Promise<void> {
    const generationPath = resolve(
        outputDirectory,
        `generation_${generationNumber}`,
    )

    const evaluationPath = resolve(
        generationPath,
        'evaluation.json',
    )

    const resultsPath = resolve(
        generationPath,
        'simulation-results.csv',
    )

    // Nothing more is required if this generation is already evaluated.
    if (await fileExists(evaluationPath)) {
        console.log(
            `Generation ${generationNumber} has already been evaluated.`,
        )
        return
    }

    // If results do not exist, run the simulations.
    if (!(await fileExists(resultsPath))) {
        console.log('')
        console.log(
            `Starting simulations for generation ${generationNumber}...`,
        )

        const strategies = await loadStrategies(
            resolve(generationPath, 'strategies.json'),
        )

        await runGeneration({
            generationNumber,
            strategies,
            outputDirectory,
            random,
        })
    } else {
        console.log(
            `Simulation results already exist for generation ${generationNumber}.`,
        )
    }

    // Evaluate the simulation results.
    console.log(`Evaluating generation ${generationNumber}...`)

    await evaluateGeneration({
        generationNumber,
        outputDirectory,
    })

    console.log(`Generation ${generationNumber} completed.`)
}

export async function runEvolutionSeries({
    generationsToRun,
    outputDirectory = resolve('scripts/strategies/generated'),
    evolutionConfig = DEFAULT_EVOLUTION_CONFIG,
    random = Math.random,
}: RunEvolutionSeriesOptions): Promise<void> {
    if (!Number.isInteger(generationsToRun) || generationsToRun < 1) {
        throw new Error('Number of generations to run must be a positive integer.')
    }

    const generationOnePath = resolve(outputDirectory, 'generation_1')

    if (!(await fileExists(generationOnePath))) {
        await createInitialGeneration({
            populationSize: evolutionConfig.populationSize,
            outputDirectory,
            random,
        })
    }

    let currentGenerationNumber = 1

    await completeGeneration(currentGenerationNumber, outputDirectory, random)

    while (currentGenerationNumber < generationsToRun) {
        const nextGenerationNumber = currentGenerationNumber + 1
        const nextGenerationPath = resolve(
            outputDirectory,
            `generation_${nextGenerationNumber}`,
        )

        if (!(await fileExists(nextGenerationPath))) {
            await runEvolution({
                previousGenerationNumber: currentGenerationNumber,
                outputDirectory,
                evolutionConfig,
                random,
            })
        } else {
            console.log(`Generation ${nextGenerationNumber} already exists. Resuming.`)
            await loadStrategies(resolve(nextGenerationPath, 'strategies.json'))
        }

        await completeGeneration(nextGenerationNumber, outputDirectory, random)

        currentGenerationNumber = nextGenerationNumber
    }
}
