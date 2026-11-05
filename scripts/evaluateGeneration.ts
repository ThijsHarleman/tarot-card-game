import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const GAMES_PER_MATCHUP_AND_POSITION = 50
const GAMES_PER_MATCHUP = GAMES_PER_MATCHUP_AND_POSITION * 2
const GAMES_PER_STRATEGY = GAMES_PER_MATCHUP_AND_POSITION * 4

type MatchupType = 'conservative' | 'generated'

interface StrategySnapshot {
    readonly name: string
}

interface Metric {
    readonly gamesPlayed: number
    readonly wins: number
    readonly winRate: number
}

interface StrategyEvaluation {
    readonly rank: number
    readonly name: string
    readonly fitness: number
    readonly gamesPlayed: number
    readonly wins: number
    readonly winRate: number
    readonly conservative: Metric
    readonly generated: Metric
    readonly player1: Metric
    readonly player2: Metric
    readonly averageScoreDifference: number
}

interface EvaluationFile {
    readonly generationNumber: number
    readonly fitnessFormula: string
    readonly strategiesEvaluated: number
    readonly gamesPerStrategy: number
    readonly rankings: readonly StrategyEvaluation[]
}

interface MutableMetric {
    gamesPlayed: number
    wins: number
}

interface StrategyStats {
    conservative: MutableMetric
    generated: MutableMetric
    player1: MutableMetric
    player2: MutableMetric
    gamesPlayed: number
    wins: number
    totalScoreDifference: number
}

interface RunEvaluationOptions {
    readonly generationNumber: number
    readonly outputDirectory?: string
}

function parseCsv(content: string): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let insideQuotes = false

    for (let index = 0; index < content.length; index++) {
        const character = content[index]

        if (character === '"') {
            if (insideQuotes && content[index + 1] === '"') {
                cell += '"'
                index++
            } else {
                insideQuotes = !insideQuotes
            }
        } else if (character === ',' && !insideQuotes) {
            row.push(cell)
            cell = ''
        } else if (
            (character === '\n' || character === '\r') &&
            !insideQuotes
        ) {
            row.push(cell)
            cell = ''

            if (row.some(value => value.length > 0)) {
                rows.push(row)
            }

            row = []

            if (character === '\r' && content[index + 1] === '\n') {
                index++
            }
        } else {
            cell += character
        }
    }

    if (insideQuotes) {
        throw new Error('CSV contains an unterminated quoted field.')
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell)
        rows.push(row)
    }

    return rows
}

function parseNumber(value: string, fieldName: string): number {
    const number = Number(value)

    if (!Number.isFinite(number)) {
        throw new Error(`Invalid number in CSV field "${fieldName}": ${value}`)
    }

    return number
}

function createMetric(): MutableMetric {
    return { gamesPlayed: 0, wins: 0 }
}

function createStats(): StrategyStats {
    return {
        conservative: createMetric(),
        generated: createMetric(),
        player1: createMetric(),
        player2: createMetric(),
        gamesPlayed: 0,
        wins: 0,
        totalScoreDifference: 0,
    }
}

function toMetric(metric: MutableMetric): Metric {
    return {
        gamesPlayed: metric.gamesPlayed,
        wins: metric.wins,
        winRate: metric.gamesPlayed === 0
            ? 0
            : metric.wins / metric.gamesPlayed,
    }
}

function validateMetric(
    metric: MutableMetric,
    strategyName: string,
    description: string,
): void {
    if (metric.gamesPlayed !== GAMES_PER_MATCHUP) {
        throw new Error(
            `${strategyName} has ${metric.gamesPlayed} ${description} games; ` +
            `expected ${GAMES_PER_MATCHUP}.`,
        )
    }
}

export async function evaluateGeneration({
    generationNumber,
    outputDirectory = resolve('scripts/strategies/generated'),
}: RunEvaluationOptions): Promise<EvaluationFile> {
    if (!Number.isInteger(generationNumber) || generationNumber < 1) {
        throw new RangeError('Generation number must be a positive integer.')
    }

    const generationPath = resolve(
        outputDirectory,
        `generation_${generationNumber}`,
    )

    const strategiesPath = resolve(generationPath, 'strategies.json')
    const resultsPath = resolve(generationPath, 'simulation-results.csv')
    const evaluationPath = resolve(generationPath, 'evaluation.json')

    const strategies = JSON.parse(
        await readFile(strategiesPath, 'utf8'),
    ) as StrategySnapshot[]

    if (!Array.isArray(strategies) || strategies.length === 0) {
        throw new Error('The generation contains no strategies.')
    }

    const names = strategies.map(strategy => strategy.name)

    if (names.some(name => typeof name !== 'string' || name.length === 0)) {
        throw new Error('The strategy snapshot contains an invalid strategy name.')
    }

    if (new Set(names).size !== names.length) {
        throw new Error('The strategy snapshot contains duplicate strategy names.')
    }

    const statsByName = new Map(
        names.map(name => [name, createStats()]),
    )

    const csvRows = parseCsv(await readFile(resultsPath, 'utf8'))

    if (csvRows.length < 2) {
        throw new Error('The simulation results CSV contains no game results.')
    }

    const headers = csvRows[0]
    const requiredColumns = [
        'evaluated_strategy',
        'matchup_type',
        'player1_strategy',
        'player2_strategy',
        'player1_score',
        'player2_score',
        'winner',
    ]

    const columnIndexes = new Map(
        headers.map((header, index) => [header, index]),
    )

    for (const column of requiredColumns) {
        if (!columnIndexes.has(column)) {
            throw new Error(`The results CSV is missing column "${column}".`)
        }
    }

    function getValue(row: string[], column: string): string {
        const index = columnIndexes.get(column)

        if (index === undefined || row[index] === undefined) {
            throw new Error(`Missing CSV value for "${column}".`)
        }

        return row[index]
    }

    for (const row of csvRows.slice(1)) {
        if (row.length !== headers.length) {
            throw new Error('A simulation CSV row has an unexpected number of fields.')
        }

        const candidateName = getValue(row, 'evaluated_strategy')
        const stats = statsByName.get(candidateName)

        if (!stats) {
            throw new Error(
                `The CSV contains an unknown evaluated strategy: ${candidateName}`,
            )
        }

        const matchupType = getValue(row, 'matchup_type') as MatchupType

        if (matchupType !== 'conservative' && matchupType !== 'generated') {
            throw new Error(`Unknown matchup type: ${matchupType}`)
        }

        const player1Name = getValue(row, 'player1_strategy')
        const player2Name = getValue(row, 'player2_strategy')

        const isPlayer1 = player1Name === candidateName
        const isPlayer2 = player2Name === candidateName

        if (isPlayer1 === isPlayer2) {
            throw new Error(
                `Candidate ${candidateName} must appear exactly once in each game.`,
            )
        }

        const player1Score = parseNumber(
            getValue(row, 'player1_score'),
            'player1_score',
        )
        const player2Score = parseNumber(
            getValue(row, 'player2_score'),
            'player2_score',
        )

        const candidateScore = isPlayer1 ? player1Score : player2Score
        const opponentScore = isPlayer1 ? player2Score : player1Score
        
        
        const winner = getValue(row, 'winner')

        if (winner !== player1Name && winner !== player2Name) {
            throw new Error(`Invalid winner "${winner}" in simulation results.`)
        }

        const candidateWon = winner === candidateName

        stats.gamesPlayed++
        stats.wins += Number(candidateWon)
        stats.totalScoreDifference += candidateScore - opponentScore

        const matchupStats = stats[matchupType]
        matchupStats.gamesPlayed++
        matchupStats.wins += Number(candidateWon)

        const positionStats = isPlayer1 ? stats.player1 : stats.player2
        positionStats.gamesPlayed++
        positionStats.wins += Number(candidateWon)
    }

    const evaluations: Omit<StrategyEvaluation, 'rank'>[] = []

    for (const [name, stats] of statsByName) {
        if (stats.gamesPlayed !== GAMES_PER_STRATEGY) {
            throw new Error(
                `${name} has ${stats.gamesPlayed} evaluated games; ` +
                `expected ${GAMES_PER_STRATEGY}.`,
            )
        }

        validateMetric(stats.conservative, name, 'conservative')
        validateMetric(stats.generated, name, 'generated')
        validateMetric(stats.player1, name, 'Player 1')
        validateMetric(stats.player2, name, 'Player 2')

        const conservative = toMetric(stats.conservative)
        const generated = toMetric(stats.generated)

        evaluations.push({
            name,
            gamesPlayed: stats.gamesPlayed,
            wins: stats.wins,
            winRate: stats.wins / stats.gamesPlayed,
            conservative,
            generated,
            player1: toMetric(stats.player1),
            player2: toMetric(stats.player2),
            averageScoreDifference:
                stats.totalScoreDifference / stats.gamesPlayed,
            fitness: 0.5 * conservative.winRate + 0.5 * generated.winRate,
        })
    }

    evaluations.sort((a, b) =>
        b.fitness - a.fitness ||
        b.generated.winRate - a.generated.winRate ||
        b.conservative.winRate - a.conservative.winRate ||
        b.averageScoreDifference - a.averageScoreDifference ||
        a.name.localeCompare(b.name),
    )

    const rankings: StrategyEvaluation[] = evaluations.map(
        (evaluation, index) => ({
            rank: index + 1,
            ...evaluation,
        }),
    )

    const evaluationFile: EvaluationFile = {
        generationNumber,
        fitnessFormula:
            '50% conservative win rate + 50% generated-opponent win rate',
        strategiesEvaluated: rankings.length,
        gamesPerStrategy: GAMES_PER_STRATEGY,
        rankings,
    }

    await writeFile(
        evaluationPath,
        `${JSON.stringify(evaluationFile, null, 2)}\n`,
        'utf8',
    )

    return evaluationFile
}
