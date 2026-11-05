import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import type { StrategyConfig } from '../../src/game/opponent/strategic/config'
import {
    generateStrategyConfig,
    DEFAULT_GENERATION_OPTIONS,
} from './strategyConfig'
import type { StrategyGenerationOptions } from './strategyConfig'

export interface SavedStrategy {
    readonly name: string
    readonly config: StrategyConfig
}

const DEFAULT_OUTPUT_PATH = resolve(
    'scripts/strategies/generated/strategies.json',
)

async function readSavedStrategies(
    filePath: string,
): Promise<SavedStrategy[]> {
    try {
        const content = await readFile(filePath, 'utf8')
        const parsed: unknown = JSON.parse(content)

        if (!Array.isArray(parsed)) {
            throw new Error('Strategy file must contain a JSON array')
        }

        return parsed as SavedStrategy[]
    } catch (error) {
        if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return []
        }

        throw error
    }
}

function getNextStrategyNumber(
    strategies: readonly SavedStrategy[],
): number {
    const numbers = strategies.map((strategy) => {
        const match = /^strategy_(\d+)$/.exec(strategy.name)
        return match?.[1] === undefined ? 0 : Number(match[1])
    })

    return Math.max(0, ...numbers) + 1
}

export async function generateStrategies(
    count: number,
    options: StrategyGenerationOptions = DEFAULT_GENERATION_OPTIONS,
    filePath = DEFAULT_OUTPUT_PATH,
): Promise<SavedStrategy[]> {
    if (!Number.isInteger(count) || count < 1) {
        throw new RangeError('count must be a positive integer')
    }

    const existingStrategies = await readSavedStrategies(filePath)
    const nextNumber = getNextStrategyNumber(existingStrategies)

    const newStrategies: SavedStrategy[] = Array.from(
        { length: count },
        (_, index) => ({
            name: `strategy_${nextNumber + index}`,
            config: generateStrategyConfig(options),
        }),
    )

    const allStrategies = [
        ...existingStrategies,
        ...newStrategies,
    ]

    await mkdir(dirname(filePath), { recursive: true })

    await writeFile(
        filePath,
        `${JSON.stringify(allStrategies, null, 2)}\n`,
        'utf8',
    )

    return newStrategies
}
