import { evaluateGeneration } from './evaluateGeneration'

async function main(): Promise<void> {
    const generationNumber = Number(process.argv[2] ?? '1')

    const evaluation = await evaluateGeneration({ generationNumber })

    console.log(`Evaluated generation ${generationNumber}.`)
    console.log(`Strategies ranked: ${evaluation.strategiesEvaluated}`)
    console.log('')

    for (const strategy of evaluation.rankings.slice(0, 10)) {
        console.log(
            `${strategy.rank}. ${strategy.name}` +
            ` | Fitness: ${(strategy.fitness * 100).toFixed(1)}%` +
            ` | Conservative: ${(strategy.conservative.winRate * 100).toFixed(1)}%` +
            ` | Generated: ${(strategy.generated.winRate * 100).toFixed(1)}%`,
        )
    }

    console.log('')
    console.log('Full evaluation saved to evaluation.json.')
}

main().catch(error => {
    console.error('Generation evaluation failed:', error)
    process.exitCode = 1
})
