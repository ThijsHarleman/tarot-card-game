import { loadStrategies } from './strategies/loadStrategies'
import { runGeneration } from './runGeneration'

async function main(): Promise<void> {
    const generationArgument = process.argv[2] ?? '1'
    const generationNumber = Number(generationArgument)

    if (!Number.isInteger(generationNumber) || generationNumber < 1) {
        throw new Error('Please provide a positive generation number.')
    }

    const strategies = await loadStrategies()

    await runGeneration({
        generationNumber,
        strategies,
    })
}

main().catch((error: unknown) => {
    console.error('Generation simulation failed:', error)
    process.exitCode = 1
})
