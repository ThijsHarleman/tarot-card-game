import { runSimulation } from './runSimulation'
import { conservativeStrategy } from '../src/game/opponent/conservativeStrategy'
import { randomStrategy } from '../src/game/opponent/randomStrategy'
import { loadStrategies } from './strategies/loadStrategies'

const GAMES_PER_SIDE = 500

async function main(): Promise<void> {
    const strategies = await loadStrategies()

    if (strategies.length === 0) {
        throw new Error('No generated strategies were found.')
    }

    console.log(`Found ${strategies.length} generated strategies.`)
    console.log(`Each strategy will play 200 games.`)
    console.log(`Total games: ${strategies.length * 200}`)
    console.log('')

    for (const candidate of strategies) {
        console.log(`Testing ${candidate.name}...`)

        // Conservative strategy: 50 games in each player position.
        console.log('  Against Conservative (Player 1)')
        await runSimulation(
            candidate.strategy,
            conservativeStrategy,
            GAMES_PER_SIDE,
        )

        console.log('  Against Conservative (Player 2)')
        await runSimulation(
            conservativeStrategy,
            candidate.strategy,
            GAMES_PER_SIDE,
        )

        // Random strategy: 50 games in each player position.
        console.log('  Against Random (Player 1)')
        await runSimulation(
            candidate.strategy,
            randomStrategy,
            GAMES_PER_SIDE,
        )

        console.log('  Against Random (Player 2)')
        await runSimulation(
            randomStrategy,
            candidate.strategy,
            GAMES_PER_SIDE,
        )

        console.log(`Finished ${candidate.name}.`)
        console.log('')
    }

    console.log('All simulations completed.')
}

main().catch((error: unknown) => {
    console.error('Simulation failed:', error)
    process.exitCode = 1
})
