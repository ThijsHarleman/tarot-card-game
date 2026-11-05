import type { StrategyConfig } from '../../src/game/opponent/strategic/config'
import {
    DEFAULT_GENERATION_OPTIONS,
    generateStrategyConfig,
} from '../strategies/strategyConfig'
import type {
    IntegerRange,
    NumericRange,
    StrategyGenerationOptions,
} from '../strategies/strategyConfig'

interface MutationOptions {
    readonly mutationRate: number
    readonly mutationStrength: number
}

type Random = () => number

function getRandomValue(random: Random): number {
    const value = random()

    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError(
            'Random function must return a value from 0 to less than 1',
        )
    }

    return value
}

function shouldMutate(rate: number, random: Random): boolean {
    return getRandomValue(random) < rate
}

function mutateNumericRange(
    value: number,
    range: NumericRange,
    strength: number,
    rate: number,
    random: Random,
): NumericRange {
    if (!shouldMutate(rate, random)) {
        return { min: value, max: value, precision: range.precision }
    }

    const variation = (range.max - range.min) * strength

    return {
        min: Math.max(range.min, value - variation),
        max: Math.min(range.max, value + variation),
        precision: range.precision,
    }
}

function mutateIntegerRange(
    value: number,
    range: IntegerRange,
    strength: number,
    rate: number,
    random: Random,
): IntegerRange {
    if (!shouldMutate(rate, random)) {
        return { min: value, max: value }
    }

    const variation = Math.ceil((range.max - range.min) * strength)

    return {
        min: Math.max(range.min, value - variation),
        max: Math.min(range.max, value + variation),
    }
}

export function mutateStrategy(
    parent: StrategyConfig,
    mutation: MutationOptions,
    options: StrategyGenerationOptions = DEFAULT_GENERATION_OPTIONS,
    random: Random = Math.random,
): StrategyConfig {
    if (
        !Number.isFinite(mutation.mutationRate) ||
        mutation.mutationRate < 0 ||
        mutation.mutationRate > 1
    ) {
        throw new RangeError('Mutation rate must be between 0 and 1.')
    }

    if (
        !Number.isFinite(mutation.mutationStrength) ||
        mutation.mutationStrength < 0 ||
        mutation.mutationStrength > 1
    ) {
        throw new RangeError('Mutation strength must be between 0 and 1.')
    }

    const { mutationRate, mutationStrength } = mutation
    const round = parent.roundEvaluation
    const roundOptions = options.roundEvaluation

    const minimumCardCount = mutateIntegerRange(
        round.minimumCardCount,
        roundOptions.minimumCardCount,
        mutationStrength,
        mutationRate,
        random,
    )

    const healthyCardCount = mutateIntegerRange(
        round.healthyCardCount,
        roundOptions.healthyCardCount,
        mutationStrength,
        mutationRate,
        random,
    )

    // Keep the minimum possible healthy count at least as high
    // as the minimum possible minimumCardCount.
    const validHealthyCardCount: IntegerRange = {
        ...healthyCardCount,
        min: Math.max(healthyCardCount.min, minimumCardCount.min),
    }

    const mutationOptions: StrategyGenerationOptions = {
        roundEvaluation: {
            ...mutateRoundWeights(
                [
                    round.bidQualityWeight,
                    round.prizeValueWeight,
                    round.winningOpportunityWeight,
                ],
                roundOptions.weightPrecision,
                mutation.mutationRate,
                mutation.mutationStrength,
                random,
            ),
            weightPrecision: roundOptions.weightPrecision,

            cardStrengthExponent: mutateNumericRange(
                round.cardStrengthExponent,
                roundOptions.cardStrengthExponent,
                mutationStrength,
                mutationRate,
                random,
            ),
            healthyCardCount: validHealthyCardCount,
            minimumCardCount,
            maxDeckSustainabilityInfluence: mutateNumericRange(
                round.maxDeckSustainabilityInfluence,
                roundOptions.maxDeckSustainabilityInfluence,
                mutationStrength,
                mutationRate,
                random,
            ),
        },

        passEvaluation: {
            bidAdvantageWeight: mutateNumericRange(
                parent.passEvaluation.bidAdvantageWeight,
                options.passEvaluation.bidAdvantageWeight,
                mutationStrength,
                mutationRate,
                random,
            ),
            winDesireWeight: mutateNumericRange(
                parent.passEvaluation.winDesireWeight,
                options.passEvaluation.winDesireWeight,
                mutationStrength,
                mutationRate,
                random,
            ),
        },

        cardEvaluation: {
            alignmentWeight: mutateNumericRange(
                parent.cardEvaluation.alignmentWeight,
                options.cardEvaluation.alignmentWeight,
                mutationStrength,
                mutationRate,
                random,
            ),
            opportunityCostWeight: mutateNumericRange(
                parent.cardEvaluation.opportunityCostWeight,
                options.cardEvaluation.opportunityCostWeight,
                mutationStrength,
                mutationRate,
                random,
            ),
            winDesirabilityThreshold: mutateNumericRange(
                parent.cardEvaluation.winDesirabilityThreshold,
                options.cardEvaluation.winDesirabilityThreshold,
                mutationStrength,
                mutationRate,
                random,
            ),
            preferredLosingBidValue: mutateNumericRange(
                parent.cardEvaluation.preferredLosingBidValue,
                options.cardEvaluation.preferredLosingBidValue,
                mutationStrength,
                mutationRate,
                random,
            ),
            aceAlignment: mutateNumericRange(
                parent.cardEvaluation.aceAlignment,
                options.cardEvaluation.aceAlignment,
                mutationStrength,
                mutationRate,
                random,
            ),
            majorArcanaLosingAlignment: mutateNumericRange(
                parent.cardEvaluation.majorArcanaLosingAlignment,
                options.cardEvaluation.majorArcanaLosingAlignment,
                mutationStrength,
                mutationRate,
                random,
            ),
            courtCardLosingAlignment: mutateNumericRange(
                parent.cardEvaluation.courtCardLosingAlignment,
                options.cardEvaluation.courtCardLosingAlignment,
                mutationStrength,
                mutationRate,
                random,
            ),
            courtCardOpportunityCost: mutateNumericRange(
                parent.cardEvaluation.courtCardOpportunityCost,
                options.cardEvaluation.courtCardOpportunityCost,
                mutationStrength,
                mutationRate,
                random,
            ),
            majorArcanaOpportunityCost: mutateNumericRange(
                parent.cardEvaluation.majorArcanaOpportunityCost,
                options.cardEvaluation.majorArcanaOpportunityCost,
                mutationStrength,
                mutationRate,
                random,
            ),
            minorArcanaOpportunityCostFactor: mutateNumericRange(
                parent.cardEvaluation.minorArcanaOpportunityCostFactor,
                options.cardEvaluation.minorArcanaOpportunityCostFactor,
                mutationStrength,
                mutationRate,
                random,
            ),
        },
    }

    return generateStrategyConfig(mutationOptions, random)
}

function mutateRoundWeights(
    values: readonly [number, number, number],
    precision: number,
    mutationRate: number,
    mutationStrength: number,
    random: Random,
): {
    bidQualityWeight: { min: number; max: number }
    prizeValueWeight: { min: number; max: number }
    winningOpportunityWeight: { min: number; max: number }
} {
    const scale = 10 ** precision

    // Convert the existing weights into integer ticks.
    const originalTicks = values.map((value) => Math.round(value * scale))

    // Mutate the first two weights independently.
    const mutatedTicks = originalTicks.map((value) => {
        if (!shouldMutate(mutationRate, random)) {
            return value
        }

        const variation = Math.round(scale * mutationStrength)
        const change = Math.round(
            (getRandomValue(random) * 2 - 1) * variation,
        )

        return Math.max(0, Math.min(scale, value + change))
    })

    // Normalize the first two weights if their total exceeds the scale.
    let first = mutatedTicks[0]
    let second = mutatedTicks[1]

    if (first + second > scale) {
        const total = first + second

        first = Math.round((first / total) * scale)
        second = scale - first
    }

    // The third weight is always the exact remainder.
    const third = scale - first - second

    return {
        bidQualityWeight: {
            min: first / scale,
            max: first / scale,
        },
        prizeValueWeight: {
            min: second / scale,
            max: second / scale,
        },
        winningOpportunityWeight: {
            min: third / scale,
            max: third / scale,
        },
    }
}
