export interface WeightedOption<T> {
    readonly value: T
    readonly weight: number
}

export function selectWeighted<T>(
    options: readonly WeightedOption<T>[],
    random: () => number = Math.random,
    preferenceExponent = 2,
): T {
    if (options.length === 0) {
        throw new Error('Cannot select from an empty collection')
    }

    if (
        !Number.isFinite(preferenceExponent) ||
        preferenceExponent <= 0
    ) {
        throw new Error('Preference exponent must be positive and finite')
    }

    if (
        options.some(option =>
            !Number.isFinite(option.weight) || option.weight < 0
        )
    ) {
        throw new Error('Weights must be non-negative and finite')
    }

    const maximumWeight = Math.max(
        ...options.map(option => option.weight),
    )

    if (maximumWeight <= 0) {
        throw new Error('Weights must have a positive total')
    }

    // Normalize before exponentiation to avoid unnecessarily large values.
    const weightedOptions = options.map(option => ({
        value: option.value,
        weight: Math.pow(
            option.weight / maximumWeight,
            preferenceExponent,
        ),
    }))

    const totalWeight = weightedOptions.reduce(
        (total, option) => total + option.weight,
        0,
    )

    let threshold = random() * totalWeight

    for (const option of weightedOptions) {
        threshold -= option.weight

        if (threshold < 0) {
            return option.value
        }
    }

    // Protect against floating-point edge cases.
    return weightedOptions[weightedOptions.length - 1].value
}
