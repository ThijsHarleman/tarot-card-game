import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { DEFAULT_EVOLUTION_CONFIG } from './evolutionConfig'
import type { EvolutionConfig } from './evolutionConfig'
import { evolveGeneration } from './evolveGeneration'
import type { StrategyEntry } from './evolveGeneration'
import { loadStrategies } from '../strategies/loadStrategies'
import type { StrategyGenerationOptions } from '../strategies/strategyConfig'
import { DEFAULT_GENERATION_OPTIONS } from '../strategies/strategyConfig'
import type { RankedStrategy } from './selectParents'

interface EvaluationSnapshot {
    readonly generationNumber: number
    readonly strategiesEvaluated: number
    readonly rankings: readonly RankedStrategy[]
}

interface RunEvolutionOptions {
    readonly previousGenerationNumber: number
    readonly outputDirectory?: string
    readonly evolutionConfig?: EvolutionConfig
    readonly generationOptions?: StrategyGenerationOptions
    readonly random?: () => number
}

function validateEvaluation(
    evaluation: EvaluationSnapshot,
    generationNumber: number,
    strategyNames: readonly string[],
): void {
    if (evaluation.generationNumber !== generationNumber) {
        throw new Error(
            `Evaluation is for generation ${evaluation.generationNumber}, ` +
            `not generation ${generationNumber}.`,
        )
    }

    if (
        !Array.isArray(evaluation.rankings) ||
        evaluation.rankings.length !== strategyNames.length
    ) {
        throw new Error('Evaluation rankings do not match the strategy snapshot.')
    }

    if (evaluation.strategiesEvaluated !== strategyNames.length) {
        throw new Error('Evaluation strategy count does not match the snapshot.')
    }

    const expectedNames = new Set(strategyNames)
    const rankedNames = new Set<string>()

    for (const ranking of evaluation.rankings) {
        if (
            typeof ranking.name !== 'string' ||
            !Number.isInteger(ranking.rank) ||
            ranking.rank < 1
        ) {
            throw new Error('Evaluation contains an invalid ranking entry.')
        }

        if (!expectedNames.has(ranking.name) || rankedNames.has(ranking.name)) {
            throw new Error(
                `Evaluation contains an unknown or duplicate strategy: ${ranking.name}`,
            )
        }

        rankedNames.add(ranking.name)
    }

    const ranks = evaluation.rankings.map(({ rank }) => rank)

    if (new Set(ranks).size !== ranks.length) {
        throw new Error('Evaluation contains duplicate ranks.')
    }
}

async function ensureDoesNotExist(path: string): Promise<void> {
    try {
        await access(path)
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return
        }

        throw error
    }

    throw new Error(`The next generation already exists: ${path}`)
}

export async function runEvolution({
    previousGenerationNumber,
    outputDirectory = resolve('scripts/strategies/generated'),
    evolutionConfig = DEFAULT_EVOLUTION_CONFIG,
    generationOptions = DEFAULT_GENERATION_OPTIONS,
    random = Math.random,
}: RunEvolutionOptions): Promise<StrategyEntry[]> {
    if (
        !Number.isInteger(previousGenerationNumber) ||
        previousGenerationNumber < 1
    ) {
        throw new RangeError('Previous generation number must be a positive integer.')
    }

    const previousGenerationPath = resolve(
        outputDirectory,
        `generation_${previousGenerationNumber}`,
    )

    const nextGenerationNumber = previousGenerationNumber + 1
    const nextGenerationPath = resolve(
        outputDirectory,
        `generation_${nextGenerationNumber}`,
    )

    const previousStrategies = await loadStrategies(
        resolve(previousGenerationPath, 'strategies.json'),
    )

    const evaluationContent = await readFile(
        resolve(previousGenerationPath, 'evaluation.json'),
        'utf8',
    )

    const evaluation = JSON.parse(evaluationContent) as EvaluationSnapshot

    validateEvaluation(
        evaluation,
        previousGenerationNumber,
        previousStrategies.map(({ name }) => name),
    )

    const strategyEntries: StrategyEntry[] = previousStrategies.map(
        ({ name, config }) => ({ name, config }),
    )

    const nextStrategies = evolveGeneration(
        strategyEntries,
        evaluation.rankings,
        evolutionConfig,
        generationOptions,
        random,
    )

    await ensureDoesNotExist(nextGenerationPath)
    await mkdir(nextGenerationPath, { recursive: true })

    const snapshot = nextStrategies.map(({ name, config }) => ({
        name,
        config,
    }))

    await writeFile(
        resolve(nextGenerationPath, 'strategies.json'),
        `${JSON.stringify(snapshot, null, 2)}\n`,
        'utf8',
    )

    return nextStrategies
}
