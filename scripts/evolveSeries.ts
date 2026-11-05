import { runEvolutionSeries } from './evolution/runEvolutionSeries'

async function main() {
    const generationsToRun = Number(process.argv[2])

    if (
        process.argv[2] === undefined ||
        !Number.isInteger(generationsToRun) ||
        generationsToRun < 1
    ) {
        throw new Error('Usage: npm run evolve -- <number-of-generations>')
    }

    await runEvolutionSeries({ generationsToRun })
}

main().catch(error => {
    console.error('Evolution series failed:', error)
    process.exitCode = 1
})
