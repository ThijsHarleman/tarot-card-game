import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { generateStrategies } from './generateStrategies'
import { loadStrategies } from './loadStrategies'

describe('generateStrategies', () => {
    it('generates, names, saves, and appends strategies', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'tarot-strategies-'))
        const filePath = join(directory, 'strategies.json')

        try {
            const firstBatch = await generateStrategies(3, undefined, filePath)

            expect(firstBatch.map((item) => item.name)).toEqual([
                'strategy_1',
                'strategy_2',
                'strategy_3',
            ])

            const secondBatch = await generateStrategies(2, undefined, filePath)

            expect(secondBatch.map((item) => item.name)).toEqual([
                'strategy_4',
                'strategy_5',
            ])

            const content = await readFile(filePath, 'utf8')
            const saved = JSON.parse(content) as unknown[]

            expect(saved).toHaveLength(5)

            const loaded = await loadStrategies(filePath)

            expect(loaded).toHaveLength(5)
            expect(loaded[0]?.strategy.name).toBe('strategy_1')
            expect(loaded[4]?.strategy.name).toBe('strategy_5')
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    })
})
