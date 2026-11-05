import { runSimulation } from './runSimulation'
import { conservativeStrategy } from '../src/game/opponent/conservativeStrategy'
import { strategy } from '../src/game/opponent/strategic/strategy'

async function main(): Promise<void> {
    const gameCountArgument = process.argv[2]
    const gameCount = Number(gameCountArgument ?? 100)

    if (!Number.isInteger(gameCount) || gameCount < 1) {
        throw new Error('Please provide a positive integer for the game count.')
    }

    await runSimulation(
        strategy,
        conservativeStrategy,
        gameCount,
        'simulation-results.csv',
    )
}

main().catch((error: unknown) => {
    console.error('Simulation failed:', error)
    process.exitCode = 1
})
