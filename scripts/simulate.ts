import { runSimulation } from './runSimulation'
// import { conservativeStrategy } from '../src/game/opponent/conservativeStrategy'
// import { strategy } from '../src/game/opponent/strategic/strategy'
import { loadStrategies } from './strategies/loadStrategies'

async function main(): Promise<void> {
    const [
        gameCountArgument = '100',
        player1Name = 'strategy_1',
        player2Name = 'strategy_2',
    ] = process.argv.slice(2)

    const gameCount = Number(gameCountArgument)

    if (!Number.isInteger(gameCount) || gameCount < 1) {
        throw new Error('Please provide a positive integer for the game count.')
    }

    const strategies = await loadStrategies()

    const player1 = strategies.find(
        (item) => item.name === player1Name,
    )

    const player2 = strategies.find(
        (item) => item.name === player2Name,
    )

    if (player1 === undefined) {
        throw new Error(`Could not find strategy: ${player1Name}`)
    }

    if (player2 === undefined) {
        throw new Error(`Could not find strategy: ${player2Name}`)
    }

    console.log(`Running ${gameCount} games:`)
    console.log(`Player 1: ${player1.name}`)
    console.log(`Player 2: ${player2.name}`)

    await runSimulation(
        player1.strategy,
        player2.strategy,
        gameCount,
    )
}

main().catch((error: unknown) => {
    console.error('Simulation failed:', error)
    process.exitCode = 1
})
