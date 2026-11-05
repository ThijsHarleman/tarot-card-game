import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { simulateGame } from '../src/game/simulation/simulateGame'
import type { GameResult } from '../src/game/simulation/simulateGame'
import { conservativeStrategy } from '../src/game/opponent/conservativeStrategy'
import type { OpponentStrategy } from '../src/game/opponent/strategy'
import type { LoadedStrategy } from './strategies/loadStrategies'

const GAMES_PER_MATCHUP_AND_POSITION = 50

type MatchupType = 'conservative' | 'generated'

type Random = () => number

interface RunGenerationOptions {
    readonly generationNumber: number
    readonly strategies: readonly LoadedStrategy[]
    readonly outputDirectory?: string
    readonly random?: Random
}

function toCsvCell(value: string | number): string {
    const text = String(value)

    if (/[",\r\n]/.test(text)) {
        return `"${text.replaceAll('"', '""')}"`
    }

    return text
}

function toCsvRow(values: readonly (string | number)[]): string {
    return `${values.map(toCsvCell).join(',')}\n`
}

function selectRandomOpponent(
    candidate: LoadedStrategy,
    strategies: readonly LoadedStrategy[],
    random: Random,
): LoadedStrategy {
    const opponents = strategies.filter(
        (strategy) => strategy.name !== candidate.name,
    )

    if (opponents.length === 0) {
        throw new Error('At least two strategies are required.')
    }

    const value = random()

    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError(
            'Random function must return a value from 0 to less than 1.',
        )
    }

    const selectedIndex = Math.floor(value * opponents.length)
    const selectedOpponent = opponents[selectedIndex]

    if (selectedOpponent === undefined) {
        throw new Error('Could not select a generated opponent.')
    }

    return selectedOpponent
}

async function saveOrVerifyStrategySnapshot(
    strategiesPath: string,
    strategies: readonly LoadedStrategy[],
): Promise<void> {
    const snapshot = strategies.map(({ name, config }) => ({
        name,
        config,
    }))

    const content = `${JSON.stringify(snapshot, null, 2)}\n`

    try {
        const existingContent = await readFile(strategiesPath, 'utf8')
        const existingSnapshot: unknown = JSON.parse(existingContent)

        if (
            JSON.stringify(existingSnapshot) !==
            JSON.stringify(snapshot)
        ) {
            throw new Error(
                `Strategy snapshot does not match the strategies being simulated: ${strategiesPath}`,
            )
        }
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            await writeFile(strategiesPath, content, {
                encoding: 'utf8',
                flag: 'wx',
            })
            return
        }

        throw error
    }
}

export async function runGeneration({
    generationNumber,
    strategies,
    outputDirectory = resolve('scripts/strategies/generated'),
    random = Math.random,
}: RunGenerationOptions): Promise<GameResult[]> {
    if (!Number.isInteger(generationNumber) || generationNumber < 1) {
        throw new RangeError('generationNumber must be a positive integer.')
    }

    if (strategies.length < 2) {
        throw new Error('At least two strategies are required.')
    }

    const strategyNames = strategies.map((strategy) => strategy.name)

    if (new Set(strategyNames).size !== strategyNames.length) {
        throw new Error('Strategy names must be unique.')
    }

    const generationPath = resolve(
        outputDirectory,
        `generation_${generationNumber}`,
    )

    await mkdir(generationPath, { recursive: true })

    const strategiesPath = resolve(generationPath, 'strategies.json')
    const resultsPath = resolve(generationPath, 'simulation-results.csv')

    await saveOrVerifyStrategySnapshot(strategiesPath, strategies)

    const header = [
        'game',
        'evaluated_strategy',
        'matchup_type',
        'player1_strategy',
        'player2_strategy',
        'player1_score',
        'player2_score',
        'winner',
    ]

    await writeFile(resultsPath, toCsvRow(header), {
        encoding: 'utf8',
        flag: 'wx',
    })

    const allResults: GameResult[] = []
    let gameNumber = 0

    async function playAndRecord(
        candidate: LoadedStrategy,
        opponent: OpponentStrategy,
        matchupType: MatchupType,
        candidateIsPlayer1: boolean,
    ): Promise<void> {
        const player1Strategy = candidateIsPlayer1
            ? candidate.strategy
            : opponent

        const player2Strategy = candidateIsPlayer1
            ? opponent
            : candidate.strategy

        const result = simulateGame(player1Strategy, player2Strategy)

        gameNumber += 1
        allResults.push(result)

        await appendFile(
            resultsPath,
            toCsvRow([
                gameNumber,
                candidate.name,
                matchupType,
                result.player1Strategy,
                result.player2Strategy,
                result.player1Score,
                result.player2Score,
                result.winner,
            ]),
            'utf8',
        )
    }

    for (const candidate of strategies) {
        console.log(`Evaluating ${candidate.name}...`)

        // 50 games against Conservative as Player 1.
        for (let index = 0; index < GAMES_PER_MATCHUP_AND_POSITION; index += 1) {
            await playAndRecord(
                candidate,
                conservativeStrategy,
                'conservative',
                true,
            )
        }

        // 50 games against Conservative as Player 2.
        for (let index = 0; index < GAMES_PER_MATCHUP_AND_POSITION; index += 1) {
            await playAndRecord(
                candidate,
                conservativeStrategy,
                'conservative',
                false,
            )
        }

        // 50 games against randomly selected generated opponents as Player 1.
        for (let index = 0; index < GAMES_PER_MATCHUP_AND_POSITION; index += 1) {
            const opponent = selectRandomOpponent(candidate, strategies, random)

            await playAndRecord(
                candidate,
                opponent.strategy,
                'generated',
                true,
            )
        }

        // 50 games against randomly selected generated opponents as Player 2.
        for (let index = 0; index < GAMES_PER_MATCHUP_AND_POSITION; index += 1) {
            const opponent = selectRandomOpponent(candidate, strategies, random)

            await playAndRecord(
                candidate,
                opponent.strategy,
                'generated',
                false,
            )
        }

        console.log(`Finished ${candidate.name}.`)
    }

    console.log('')
    console.log(`Generation ${generationNumber} completed.`)
    console.log(`Strategies: ${strategies.length}`)
    console.log(`Games played: ${gameNumber}`)
    console.log(`Results: ${resultsPath}`)

    return allResults
}
