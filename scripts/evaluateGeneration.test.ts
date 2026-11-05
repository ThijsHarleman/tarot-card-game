import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { evaluateGeneration } from './evaluateGeneration'

const STRATEGY_NAMES = ['Alpha', 'Beta', 'Gamma']

const CSV_HEADER = [
    'game',
    'evaluated_strategy',
    'matchup_type',
    'player1_strategy',
    'player2_strategy',
    'player1_score',
    'player2_score',
    'winner',
]

const WIN_COUNTS: Record<
    string,
    Record<string, Record<string, number>>
> = {
    Alpha: {
        conservative: { player1: 30, player2: 20 },
        generated: { player1: 40, player2: 30 },
    },
    Beta: {
        conservative: { player1: 30, player2: 30 },
        generated: { player1: 25, player2: 25 },
    },
    Gamma: {
        conservative: { player1: 10, player2: 10 },
        generated: { player1: 15, player2: 15 },
    },
}

let temporaryDirectory: string
let generationDirectory: string

function createCsvRows(): string[][] {
    const rows: string[][] = []
    let gameNumber = 0

    for (const candidate of STRATEGY_NAMES) {
        const otherStrategies = STRATEGY_NAMES.filter(
            name => name !== candidate,
        )

        for (const matchup of ['conservative', 'generated'] as const) {
            for (const position of ['player1', 'player2'] as const) {
                const wins = WIN_COUNTS[candidate][matchup][position]

                for (let game = 0; game < 50; game++) {
                    gameNumber++

                    const candidateIsPlayer1 = position === 'player1'

                    const opponentName = matchup === 'conservative'
                        ? 'Conservative'
                        : otherStrategies[0]

                    const player1Name = candidateIsPlayer1
                        ? candidate
                        : opponentName

                    const player2Name = candidateIsPlayer1
                        ? opponentName
                        : candidate

                    const candidateWon = game < wins

                    const winner = candidateWon
                        ? candidate
                        : opponentName

                    const player1Won = winner === player1Name

                    rows.push([
                        String(gameNumber),
                        candidate,
                        matchup,
                        player1Name,
                        player2Name,
                        player1Won ? '120' : '111',
                        player1Won ? '111' : '120',
                        winner,
                    ])
                }
            }
        }
    }

    return rows
}

async function createGeneration(): Promise<string[][]> {
    generationDirectory = join(temporaryDirectory, 'generation_1')

    const strategies = STRATEGY_NAMES.map(name => ({
        name,
        config: {},
    }))

    await mkdir(generationDirectory, { recursive: true })

    await writeFile(
        join(generationDirectory, 'strategies.json'),
        JSON.stringify(strategies, null, 2),
    )

    const rows = createCsvRows()

    const csvContent = [
        CSV_HEADER,
        ...rows,
    ].map(row => row.join(',')).join('\n')

    await writeFile(
        join(generationDirectory, 'simulation-results.csv'),
        `${csvContent}\n`,
    )

    return rows
}

describe('evaluateGeneration', () => {
    beforeEach(async () => {
        temporaryDirectory = await mkdtemp(
            join(tmpdir(), 'evaluate-generation-'),
        )
    })

    afterEach(async () => {
        await rm(temporaryDirectory, { recursive: true, force: true })
    })

    it('evaluates every strategy using exactly 200 games', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        expect(result.strategiesEvaluated).toBe(3)
        expect(result.gamesPerStrategy).toBe(200)

        for (const strategy of result.rankings) {
            expect(strategy.gamesPlayed).toBe(200)
        }
    })

    it('calculates the correct number of games for each matchup and position', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        const alpha = result.rankings.find(
            strategy => strategy.name === 'Alpha',
        )

        expect(alpha).toBeDefined()

        expect(alpha?.conservative.gamesPlayed).toBe(100)
        expect(alpha?.generated.gamesPlayed).toBe(100)
        expect(alpha?.player1.gamesPlayed).toBe(100)
        expect(alpha?.player2.gamesPlayed).toBe(100)
    })

    it('calculates win rates and fitness correctly', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        const alpha = result.rankings.find(
            strategy => strategy.name === 'Alpha',
        )

        expect(alpha?.conservative.wins).toBe(50)
        expect(alpha?.conservative.winRate).toBe(0.5)

        expect(alpha?.generated.wins).toBe(70)
        expect(alpha?.generated.winRate).toBe(0.7)

        expect(alpha?.wins).toBe(120)
        expect(alpha?.winRate).toBe(0.6)

        expect(alpha?.fitness).toBe(0.6)
    })

    it('calculates position-specific win rates correctly', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        const alpha = result.rankings.find(
            strategy => strategy.name === 'Alpha',
        )

        expect(alpha?.player1.wins).toBe(70)
        expect(alpha?.player1.winRate).toBe(0.7)

        expect(alpha?.player2.wins).toBe(50)
        expect(alpha?.player2.winRate).toBe(0.5)
    })

    it('calculates average score difference correctly', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        const alpha = result.rankings.find(
            strategy => strategy.name === 'Alpha',
        )

        // 120 wins and 80 losses.
        // Each win contributes +9 and each loss contributes -9.
        expect(alpha?.averageScoreDifference).toBe(1.8)
    })

    it('ranks strategies by fitness', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        expect(result.rankings.map(strategy => strategy.name)).toEqual([
            'Alpha',
            'Beta',
            'Gamma',
        ])

        expect(result.rankings.map(strategy => strategy.rank)).toEqual([
            1,
            2,
            3,
        ])

        expect(result.rankings.map(strategy => strategy.fitness)).toEqual([
            0.6,
            0.55,
            0.25,
        ])
    })

    it('saves the evaluation to evaluation.json', async () => {
        await createGeneration()

        const result = await evaluateGeneration({
            generationNumber: 1,
            outputDirectory: temporaryDirectory,
        })

        const savedContent = await readFile(
            join(generationDirectory, 'evaluation.json'),
            'utf8',
        )

        expect(JSON.parse(savedContent)).toEqual(result)
    })

    it('rejects a strategy with fewer than 200 evaluated games', async () => {
        const rows = await createGeneration()

        // Remove one generated-opponent game belonging to Alpha.
        const incompleteRows = rows.filter(
            row => !(
                row[1] === 'Alpha' &&
                row[2] === 'generated' &&
                row[0] === '151'
            ),
        )

        const csvContent = [
            CSV_HEADER,
            ...incompleteRows,
        ].map(row => row.join(',')).join('\n')

        await writeFile(
            join(generationDirectory, 'simulation-results.csv'),
            `${csvContent}\n`,
        )

        await expect(
            evaluateGeneration({
                generationNumber: 1,
                outputDirectory: temporaryDirectory,
            }),
        ).rejects.toThrow(
            'Alpha has 199 evaluated games; expected 200.',
        )
    })

    it('rejects an invalid generation number', async () => {
        await expect(
            evaluateGeneration({
                generationNumber: 0,
                outputDirectory: temporaryDirectory,
            }),
        ).rejects.toThrow('Generation number must be a positive integer.')
    })
})
