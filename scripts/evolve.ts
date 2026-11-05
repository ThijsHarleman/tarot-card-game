import { runEvolution } from './evolution/runEvolution'

async function main(): Promise<void> {
    const previousGenerationNumber = Number(process.argv[2])

    if (
        process.argv[2] === undefined ||
        !Number.isInteger(previousGenerationNumber) ||
        previousGenerationNumber < 1
    ) {
        throw new Error(
            'Usage: npm run evolve-generation -- <previous-generation-number>',
        )
    }

    const nextStrategies = await runEvolution({
        previousGenerationNumber,
    })

    console.log(
        `Created generation ${previousGenerationNumber + 1} ` +
        `with ${nextStrategies.length} strategies.`,
    )
}

main().catch((error: unknown) => {
    console.error('Generation evolution failed:', error)
    process.exitCode = 1
})
