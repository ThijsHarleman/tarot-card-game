import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runSimulation } from './runSimulation'
import type { OpponentStrategy } from '../src/game/opponent/strategy'

function createPassingStrategy(name: string): OpponentStrategy {
    return {
        name,
        chooseAction: () => ({ type: 'pass' }),
    }
}

describe('runSimulation', () => {
    it('writes one CSV row for each completed game', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'tarot-simulation-'))
        const outputPath = join(directory, 'results.csv')

        try {
            const player1Strategy = createPassingStrategy('Strategy 1')
            const player2Strategy = createPassingStrategy('Strategy 2')

            const results = await runSimulation(
                player1Strategy,
                player2Strategy,
                3,
                outputPath,
            )

            const csv = await readFile(outputPath, 'utf8')
            const rows = csv.trim().split(/\r?\n/)

            expect(results).toHaveLength(3)
            expect(rows).toHaveLength(4)

            expect(rows[0]).toBe(
                'game,player1_strategy,player2_strategy,player1_score,player2_score,winner',
            )

            expect(rows[1]).toContain('1,Strategy 1,Strategy 2,')
            expect(rows[2]).toContain('2,Strategy 1,Strategy 2,')
            expect(rows[3]).toContain('3,Strategy 1,Strategy 2,')

            for (const result of results) {
                expect(
                    result.player1Score + result.player2Score,
                ).toBe(231)
            }
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    })

    it('rejects zero or invalid game counts', async () => {
        const strategy = createPassingStrategy('Test')

        await expect(
            runSimulation(strategy, strategy, 0),
        ).rejects.toThrow('gameCount must be a positive integer')

        await expect(
            runSimulation(strategy, strategy, 1.5),
        ).rejects.toThrow('gameCount must be a positive integer')
    })
})
