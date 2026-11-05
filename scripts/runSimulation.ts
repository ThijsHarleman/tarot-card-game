import { appendFile, access } from 'node:fs/promises'
import { simulateGame } from '../src/game/simulation/simulateGame'
import type { GameResult } from '../src/game/simulation/simulateGame'
import type { OpponentStrategy } from '../src/game/opponent/strategy'

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

/**
 * Runs the requested number of games and appends each result to a CSV file.
 * Player 1 always uses player1Strategy; player 2 always uses player2Strategy.
 */
export async function runSimulation(
    player1Strategy: OpponentStrategy,
    player2Strategy: OpponentStrategy,
    gameCount: number,
    outputPath = 'simulation-results.csv',
): Promise<GameResult[]> {
    if (!Number.isInteger(gameCount) || gameCount < 1) {
        throw new RangeError('gameCount must be a positive integer')
    }

    const header = [
        'game',
        'player1_strategy',
        'player2_strategy',
        'player1_score',
        'player2_score',
        'winner',
    ]

    // Create the CSV and its header only if the file doesn't exist.
    try {
        await access(outputPath)
    } catch {
        await appendFile(outputPath, toCsvRow(header), 'utf8')
    }

    const results: GameResult[] = []

    for (let gameNumber = 1; gameNumber <= gameCount; gameNumber += 1) {
        const result = simulateGame(player1Strategy, player2Strategy)

        results.push(result)

        const row = toCsvRow([
            gameNumber,
            result.player1Strategy,
            result.player2Strategy,
            result.player1Score,
            result.player2Score,
            result.winner,
        ])

        await appendFile(outputPath, row, 'utf8')

        console.log(
            `Game ${gameNumber}/${gameCount}: ` +
            `${result.player1Score} - ${result.player2Score} ` +
            `(${result.winner})`,
        )
    }

    return results
}
