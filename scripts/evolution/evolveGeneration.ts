import type { StrategyConfig } from '../../src/game/opponent/strategic/config'
import {
    generateStrategyConfig,
    DEFAULT_GENERATION_OPTIONS,
} from '../strategies/strategyConfig'
import type { StrategyGenerationOptions } from '../strategies/strategyConfig'
import { chooseParent, selectParents } from './selectParents'
import type { RankedStrategy } from './selectParents'
import { mutateStrategy } from './mutateStrategy'
import type { EvolutionConfig } from './evolutionConfig'

export interface StrategyEntry {
    readonly name: string
    readonly config: StrategyConfig
}

type Random = () => number

function validateEvolutionConfig(config: EvolutionConfig): void {
    const {
        populationSize,
        eliteCount,
        parentPoolSize,
        randomStrategyCount,
        mutationRate,
        mutationStrength,
    } = config

    for (const [name, value] of [
        ['populationSize', populationSize],
        ['eliteCount', eliteCount],
        ['parentPoolSize', parentPoolSize],
        ['randomStrategyCount', randomStrategyCount],
    ] as const) {
        if (!Number.isInteger(value) || value < 0) {
            throw new RangeError(`${name} must be a non-negative integer.`)
        }
    }

    if (populationSize < 1) {
        throw new RangeError('Population size must be at least 1.')
    }

    if (eliteCount > parentPoolSize) {
        throw new RangeError('Elite count cannot exceed parent pool size.')
    }

    if (eliteCount + randomStrategyCount > populationSize) {
        throw new RangeError(
            'Elite and random strategy counts cannot exceed population size.',
        )
    }

    if (parentPoolSize < 1) {
        throw new RangeError('Parent pool size must be at least 1.')
    }

    if (mutationRate < 0 || mutationRate > 1 || !Number.isFinite(mutationRate)) {
        throw new RangeError('Mutation rate must be between 0 and 1.')
    }

    if (
        mutationStrength < 0 ||
        mutationStrength > 1 ||
        !Number.isFinite(mutationStrength)
    ) {
        throw new RangeError('Mutation strength must be between 0 and 1.')
    }
}

export function evolveGeneration(
    previousStrategies: readonly StrategyEntry[],
    rankings: readonly RankedStrategy[],
    config: EvolutionConfig,
    generationOptions: StrategyGenerationOptions = DEFAULT_GENERATION_OPTIONS,
    random: Random = Math.random,
): StrategyEntry[] {
    validateEvolutionConfig(config)

    if (config.parentPoolSize > previousStrategies.length) {
        throw new RangeError(
            'Parent pool size cannot exceed the number of previous strategies.',
        )
    }

    const { elites, parentPool } = selectParents(
        previousStrategies,
        rankings,
        config.eliteCount,
        config.parentPoolSize,
    )

    const offspringCount =
        config.populationSize - config.eliteCount - config.randomStrategyCount

    const nextGeneration: StrategyEntry[] = []

    // Preserve elite configurations without mutation.
    nextGeneration.push(...elites.map(({ config: strategyConfig }) => ({
        name: '',
        config: strategyConfig,
    })))

    // Create mutated offspring from selected parents.
    for (let index = 0; index < offspringCount; index += 1) {
        const parent = chooseParent(parentPool, random)

        const childConfig = mutateStrategy(
            parent.config,
            {
                mutationRate: config.mutationRate,
                mutationStrength: config.mutationStrength,
            },
            generationOptions,
            random,
        )

        nextGeneration.push({
            name: '',
            config: childConfig,
        })
    }

    // Add completely random strategies to maintain exploration.
    for (let index = 0; index < config.randomStrategyCount; index += 1) {
        nextGeneration.push({
            name: '',
            config: generateStrategyConfig(generationOptions, random),
        })
    }

    // Give every strategy a unique, sequential name in the new generation.
    return nextGeneration.map((strategy, index) => ({
        ...strategy,
        name: `strategy_${index + 1}`,
    }))
}
