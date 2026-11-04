export interface WeightedOption<T> {
    readonly value: T
    readonly weight: number
}

export function selectWeighted<T>(
    options: readonly WeightedOption<T>[],
    random: () => number = Math.random,
): T {
    if (options.length === 0) {
        throw new Error('Cannot select from an empty collection')
    }

    const totalWeight = options.reduce(
        (total, option) => total + option.weight,
        0,
    )

    if (
        options.some(option => !Number.isFinite(option.weight) || option.weight < 0) ||
        totalWeight <= 0
    ) {
        throw new Error('Weights must be non-negative and have a positive total')
    }

    let threshold = random() * totalWeight

    for (const option of options) {
        threshold -= option.weight

        if (threshold < 0) {
            return option.value
        }
    }

    // Protect against floating-point edge cases.
    return options[options.length - 1].value
}
