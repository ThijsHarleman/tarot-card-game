import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { DEFAULT_STRATEGY_CONFIG } from '../src/game/opponent/strategic/config'
import type { OpponentStrategy } from '../src/game/opponent/strategy'
import type { GameResult } from '../src/game/simulation/simulateGame'
import type { LoadedStrategy } from './strategies/loadStrategies'

const { mockSimulateGame } = vi.hoisted(() => ({
    mockSimulateGame: vi.fn(),
}))

vi.mock('../src/game/simulation/simulateGame', () => ({
    simulateGame: mockSimulateGame,
}))

import { runGeneration } from './runGeneration'

function createLoadedStrategy(name: string): LoadedStrategy {
    const strategy: OpponentStrategy = {
        name,
        chooseAction: () => ({ type: 'pass' }),
    }

    return {
        name,
        config: DEFAULT_STRATEGY_CONFIG,
        strategy,
    }
}

function createGameResult(
    player1Strategy: OpponentStrategy,
    player2Strategy: OpponentStrategy,
): GameResult {
    return {
        player1Strategy: player1Strategy.name,
        player2Strategy: player2Strategy.name,
        player1Score: 120,
        player2Score: 111,
        winner: player1Strategy.name,
    }
}

describe('runGeneration', () => {
    let temporaryDirectory: string

    const strategies = [
        createLoadedStrategy('strategy_1'),
        createLoadedStrategy('strategy_2'),
        createLoadedStrategy('strategy_3'),
    ]

    beforeEach(async () => {
        temporaryDirectory = await mkdtemp(
            join(tmpdir(), 'tarot-generation-'),
        )

        mockSimulateGame.mockImplementation(
            (
                player1Strategy: OpponentStrategy,
                player2Strategy: OpponentStrategy,
            ) => createGameResult(player1Strategy, player2Strategy),
        )
    })

    afterEach(async () => {
        vi.clearAllMocks()

        await rm(temporaryDirectory, {
            recursive: true,
            force: true,
        })
    })

    async function runTestGeneration(
        random: () => number = () => 0,
    ): Promise<string[]> {
        await runGeneration({
            generationNumber: 1,
            strategies,
            outputDirectory: temporaryDirectory,
            random,
        })

        const csvPath = join(
            temporaryDirectory,
            'generation_1',
            'simulation-results.csv',
        )

        const content = await readFile(csvPath, 'utf8')

        return content.trim().split('\n')
    }

    it('runs exactly 200 scheduled games for every candidate', async () => {
        const rows = await runTestGeneration()

        // One header row plus 3 candidates with 200 games each.
        expect(rows).toHaveLength(1 + strategies.length * 200)

        for (const strategy of strategies) {
            const candidateRows = rows
                .slice(1)
                .filter((row) => row.split(',')[1] === strategy.name)

            expect(candidateRows).toHaveLength(200)
        }

        expect(mockSimulateGame).toHaveBeenCalledTimes(600)
    })

    it('runs 50 games per matchup type and player position', async () => {
        const rows = await runTestGeneration()

        const gameRows = rows.slice(1).map((row) => row.split(','))

        for (const strategy of strategies) {
            const candidateRows = gameRows.filter(
                (row) => row[1] === strategy.name,
            )

            const countGames = (
                matchupType: string,
                playerPosition: 1 | 2,
            ) => candidateRows.filter((row) => {
                const isCorrectMatchup = row[2] === matchupType
                const isCorrectPosition = row[playerPosition === 1 ? 3 : 4]
                    === strategy.name

                return isCorrectMatchup && isCorrectPosition
            }).length

            expect(countGames('conservative', 1)).toBe(50)
            expect(countGames('conservative', 2)).toBe(50)
            expect(countGames('generated', 1)).toBe(50)
            expect(countGames('generated', 2)).toBe(50)
        }
    })

    it('never selects the candidate as its own generated opponent', async () => {
        const rows = await runTestGeneration()

        const generatedRows = rows
            .slice(1)
            .map((row) => row.split(','))
            .filter((row) => row[2] === 'generated')

        for (const row of generatedRows) {
            const evaluatedStrategy = row[1]
            const player1Strategy = row[3]
            const player2Strategy = row[4]

            const opponent = player1Strategy === evaluatedStrategy
                ? player2Strategy
                : player1Strategy

            expect(opponent).not.toBe(evaluatedStrategy)
        }
    })

    it('selects every other strategy with equal frequency when random values are evenly distributed', async () => {
        let randomCall = 0

        const random = () => {
            const value = randomCall % 2 === 0 ? 0 : 0.5
            randomCall += 1
            return value
        }

        const rows = await runTestGeneration(random)

        const generatedRows = rows
            .slice(1)
            .map((row) => row.split(','))
            .filter((row) => row[2] === 'generated')

        for (const candidate of strategies) {
            const candidateRows = generatedRows.filter(
                (row) => row[1] === candidate.name,
            )

            const opponentCounts = new Map<string, number>()

            for (const row of candidateRows) {
                const opponent = row[3] === candidate.name
                    ? row[4]!
                    : row[3]!

                opponentCounts.set(
                    opponent,
                    (opponentCounts.get(opponent) ?? 0) + 1,
                )
            }

            const possibleOpponents = strategies.filter(
                (strategy) => strategy.name !== candidate.name,
            )

            expect(opponentCounts.size).toBe(2)

            for (const opponent of possibleOpponents) {
                expect(opponentCounts.get(opponent.name)).toBe(50)
            }
        }
    })

    it('saves a snapshot of the generation strategies', async () => {
        await runTestGeneration()

        const strategiesPath = join(
            temporaryDirectory,
            'generation_1',
            'strategies.json',
        )

        const content = await readFile(strategiesPath, 'utf8')
        const savedStrategies = JSON.parse(content) as {
            name: string
            config: unknown
        }[]

        expect(savedStrategies).toHaveLength(3)

        expect(savedStrategies.map((strategy) => strategy.name)).toEqual([
            'strategy_1',
            'strategy_2',
            'strategy_3',
        ])

        // The runtime strategy object should not be saved.
        expect(savedStrategies[0]).not.toHaveProperty('strategy')
    })

    it('does not overwrite an existing generation', async () => {
        await runTestGeneration()

        await expect(
            runGeneration({
                generationNumber: 1,
                strategies,
                outputDirectory: temporaryDirectory,
            }),
        ).rejects.toThrow()
    })

    it('requires at least two strategies', async () => {
        await expect(
            runGeneration({
                generationNumber: 1,
                strategies: [strategies[0]!],
                outputDirectory: temporaryDirectory,
            }),
        ).rejects.toThrow('At least two strategies are required.')
    })

    it('rejects duplicate strategy names', async () => {
        await expect(
            runGeneration({
                generationNumber: 1,
                strategies: [
                    strategies[0]!,
                    strategies[0]!,
                ],
                outputDirectory: temporaryDirectory,
            }),
        ).rejects.toThrow('Strategy names must be unique.')
    })
})
