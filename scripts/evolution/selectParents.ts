export interface RankedStrategy {
    readonly name: string
    readonly rank: number
}

export interface ParentSelection<T> {
    /** Top-ranked strategies carried into the next generation unchanged. */
    readonly elites: readonly T[]

    /** Top-ranked strategies eligible to produce offspring. */
    readonly parentPool: readonly T[]
}

type Random = () => number

function getRandomValue(random: Random): number {
    const value = random()

    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError('Random value must be between 0 (inclusive) and 1 (exclusive).')
    }

    return value
}

export function selectParents<T extends { readonly name: string }>(
    strategies: readonly T[],
    rankings: readonly RankedStrategy[],
    eliteCount: number,
    parentPoolSize: number,
): ParentSelection<T> {
    if (!Number.isInteger(eliteCount) || eliteCount < 0) {
        throw new RangeError('Elite count must be a non-negative integer.')
    }

    if (!Number.isInteger(parentPoolSize) || parentPoolSize < 1) {
        throw new RangeError('Parent pool size must be a positive integer.')
    }

    if (eliteCount > parentPoolSize) {
        throw new RangeError('Elite count cannot exceed parent pool size.')
    }

    if (parentPoolSize > strategies.length) {
        throw new RangeError('Parent pool size cannot exceed the number of strategies.')
    }

    const strategiesByName = new Map(
        strategies.map((strategy) => [strategy.name, strategy]),
    )

    if (strategiesByName.size !== strategies.length) {
        throw new Error('Strategy names must be unique.')
    }

    if (rankings.length !== strategies.length) {
        throw new Error('There must be one ranking for every strategy.')
    }

    const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank)

    const rankedStrategies = sortedRankings.map((ranking) => {
        const strategy = strategiesByName.get(ranking.name)

        if (!strategy) {
            throw new Error(`No strategy found for ranking: ${ranking.name}`)
        }

        return strategy
    })

    if (new Set(sortedRankings.map((ranking) => ranking.name)).size !== rankings.length) {
        throw new Error('Each strategy must appear exactly once in the rankings.')
    }

    return {
        elites: rankedStrategies.slice(0, eliteCount),
        parentPool: rankedStrategies.slice(0, parentPoolSize),
    }
}

/**
 * Selects one parent from a rank-ordered pool.
 * Earlier entries have higher weights: N, N-1, ..., 1.
 */
export function chooseParent<T>(
    parentPool: readonly T[],
    random: Random = Math.random,
): T {
    if (parentPool.length === 0) {
        throw new Error('Cannot choose a parent from an empty pool.')
    }

    const value = getRandomValue(random)
    const totalWeight = (parentPool.length * (parentPool.length + 1)) / 2

    let selection = value * totalWeight

    for (let index = 0; index < parentPool.length; index += 1) {
        const weight = parentPool.length - index
        selection -= weight

        if (selection < 0) {
            return parentPool[index]
        }
    }

    // Protects against floating-point edge cases.
    return parentPool[parentPool.length - 1]
}
