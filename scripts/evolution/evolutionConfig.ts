export interface EvolutionConfig {
    readonly populationSize: number
    readonly eliteCount: number
    readonly parentPoolSize: number
    readonly randomStrategyCount: number

    // Probability that an individual parameter is mutated.
    readonly mutationRate: number

    // Maximum proportional change for numeric parameters.
    // For example, 0.2 means a maximum change of 20%
    // of the configured parameter range.
    readonly mutationStrength: number
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
    populationSize: 100,
    eliteCount: 10,
    parentPoolSize: 20,
    randomStrategyCount: 10,
    mutationRate: 0.2,
    mutationStrength: 0.2,
}
