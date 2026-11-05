import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateStrategyConfig } from '../strategies/strategyConfig'
import { DEFAULT_GENERATION_OPTIONS } from '../strategies/strategyConfig'
import type { StrategyGenerationOptions } from '../strategies/strategyConfig'
import type { StrategyEntry } from './evolveGeneration'

type Random = () => number

interface CreateInitialGenerationOptions {
    readonly populationSize: number
    readonly outputDirectory: string
    readonly generationOptions?: StrategyGenerationOptions
    readonly random?: Random
}

export async function createInitialGeneration({
    populationSize,
    outputDirectory,
    generationOptions = DEFAULT_GENERATION_OPTIONS,
    random = Math.random,
}: CreateInitialGenerationOptions): Promise<StrategyEntry[]> {
    if (!Number.isInteger(populationSize) || populationSize < 1) {
        throw new Error('Population size must be a positive integer.')
    }

    const generationPath = resolve(outputDirectory, 'generation_1')

    await mkdir(generationPath, { recursive: false })

    const strategies: StrategyEntry[] = Array.from(
        { length: populationSize },
        (_, index) => ({
            name: `strategy_${index + 1}`,
            config: generateStrategyConfig(generationOptions, random),
        }),
    )

    await writeFile(
        resolve(generationPath, 'strategies.json'),
        `${JSON.stringify(strategies, null, 2)}\n`,
        { encoding: 'utf8', flag: 'wx' },
    )

    return strategies
}
