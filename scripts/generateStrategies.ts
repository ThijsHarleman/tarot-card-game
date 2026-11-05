import { generateStrategies } from './strategies/generateStrategies'

async function main(): Promise<void> {
    const count = Number(process.argv[2] ?? 1)

    if (!Number.isInteger(count) || count < 1) {
        throw new Error('Please provide a positive integer for the strategy count.')
    }

    const strategies = await generateStrategies(count)

    console.log(`Generated ${strategies.length} strategies:`)

    for (const strategy of strategies) {
        console.log(`- ${strategy.name}`)
    }
}

main().catch((error: unknown) => {
    console.error('Strategy generation failed:', error)
    process.exitCode = 1
})
