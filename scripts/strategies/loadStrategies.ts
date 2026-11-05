import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createStrategy } from '../../src/game/opponent/strategic/strategy'
import type { OpponentStrategy } from '../../src/game/opponent/strategy'
import type { StrategyConfig } from '../../src/game/opponent/strategic/config'
import type { SavedStrategy } from './generateStrategies'

const DEFAULT_INPUT_PATH = resolve(
    'scripts/strategies/generated/strategies.json',
)

export interface LoadedStrategy extends SavedStrategy {
    readonly strategy: OpponentStrategy
}

export async function loadStrategies(
    filePath = DEFAULT_INPUT_PATH,
): Promise<LoadedStrategy[]> {
    const content = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(content)

    if (!Array.isArray(parsed)) {
        throw new Error('Strategy file must contain a JSON array')
    }

    const savedStrategies = parsed as SavedStrategy[]

    return savedStrategies.map((saved) => {
        if (
            typeof saved.name !== 'string' ||
            saved.name.length === 0 ||
            typeof saved.config !== 'object' ||
            saved.config === null
        ) {
            throw new Error('Invalid saved strategy entry')
        }

        return {
            ...saved,
            strategy: createStrategy(
                saved.config as StrategyConfig,
                saved.name,
            ),
        }
    })
}
