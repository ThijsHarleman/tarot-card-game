import type { StrategyConfig } from '../../src/game/opponent/strategic/config'

export interface NumericRange {
    readonly min: number
    readonly max: number
    readonly precision: number
}

export interface IntegerRange {
    readonly min: number
    readonly max: number
}

export interface StrategyGenerationOptions {
    readonly roundEvaluation: {
        readonly bidQualityWeight: Omit<NumericRange, 'precision'>
        readonly prizeValueWeight: Omit<NumericRange, 'precision'>
        readonly winningOpportunityWeight: Omit<NumericRange, 'precision'>
        readonly weightPrecision: number

        readonly cardStrengthExponent: NumericRange
        readonly healthyCardCount: IntegerRange
        readonly minimumCardCount: IntegerRange
        readonly maxDeckSustainabilityInfluence: NumericRange
    }

    readonly passEvaluation: {
        readonly bidAdvantageWeight: NumericRange
        readonly winDesireWeight: NumericRange
    }

    readonly cardEvaluation: {
        readonly alignmentWeight: NumericRange
        readonly opportunityCostWeight: NumericRange
        readonly winDesirabilityThreshold: NumericRange
        readonly preferredLosingBidValue: NumericRange
        readonly aceAlignment: NumericRange
        readonly majorArcanaLosingAlignment: NumericRange
        readonly courtCardLosingAlignment: NumericRange
        readonly courtCardOpportunityCost: NumericRange
        readonly majorArcanaOpportunityCost: NumericRange
        readonly minorArcanaOpportunityCostFactor: NumericRange
    }
}

const UNIT_RANGE: NumericRange = {
    min: 0,
    max: 1,
    precision: 2,
}

export const DEFAULT_GENERATION_OPTIONS: StrategyGenerationOptions = {
    roundEvaluation: {
        bidQualityWeight: { min: 0, max: 1 },
        prizeValueWeight: { min: 0, max: 1 },
        winningOpportunityWeight: { min: 0, max: 1 },
        weightPrecision: 2,

        cardStrengthExponent: {
            min: 0,
            max: 10,
            precision: 2,
        },
        healthyCardCount: {
            min: 0,
            max: 20,
        },
        minimumCardCount: {
            min: 0,
            max: 20,
        },
        maxDeckSustainabilityInfluence: { ...UNIT_RANGE },
    },

    passEvaluation: {
        bidAdvantageWeight: { ...UNIT_RANGE },
        winDesireWeight: { ...UNIT_RANGE },
    },

    cardEvaluation: {
        alignmentWeight: { ...UNIT_RANGE },
        opportunityCostWeight: { ...UNIT_RANGE },
        winDesirabilityThreshold: { ...UNIT_RANGE },
        preferredLosingBidValue: { ...UNIT_RANGE },
        aceAlignment: { ...UNIT_RANGE },
        majorArcanaLosingAlignment: { ...UNIT_RANGE },
        courtCardLosingAlignment: { ...UNIT_RANGE },
        courtCardOpportunityCost: { ...UNIT_RANGE },
        majorArcanaOpportunityCost: { ...UNIT_RANGE },
        minorArcanaOpportunityCostFactor: { ...UNIT_RANGE },
    },
}

type Random = () => number

function getRandomInteger(
    min: number,
    max: number,
    random: Random,
): number {
    if (
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min > max
    ) {
        throw new RangeError(`Invalid integer range: ${min} to ${max}`)
    }

    const value = random()

    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError('Random function must return a value from 0 to less than 1')
    }

    return Math.floor(value * (max - min + 1)) + min
}

function generateNumber(
    range: NumericRange,
    random: Random,
): number {
    const scale = 10 ** range.precision
    const min = toMinimumTick(range.min, scale)
    const max = toMaximumTick(range.max, scale)

    if (min > max) {
        throw new RangeError(
            'Numeric range contains no values at the requested precision',
        )
    }

    return getRandomInteger(min, max, random) / scale
}

function validateIntegerRange(range: IntegerRange): void {
    if (
        !Number.isInteger(range.min) ||
        !Number.isInteger(range.max) ||
        range.min > range.max
    ) {
        throw new RangeError('Invalid integer generation range')
    }
}

function toMinimumTick(value: number, scale: number): number {
    const scaled = value * scale
    const tolerance =
        Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4

    return Math.ceil(scaled - tolerance)
}

function toMaximumTick(value: number, scale: number): number {
    const scaled = value * scale
    const tolerance =
        Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4

    return Math.floor(scaled + tolerance)
}

/**
 * Generates three weights whose sum is exactly 1 at the configured precision.
 * The ranges are respected, provided a valid combination exists.
 */
function generateRoundWeights(
    options: StrategyGenerationOptions['roundEvaluation'],
    random: Random,
): {
    bidQualityWeight: number
    prizeValueWeight: number
    winningOpportunityWeight: number
} {
    const precision = options.weightPrecision

    if (
        !Number.isInteger(precision) ||
        precision < 0 ||
        precision > 10
    ) {
        throw new RangeError('Invalid round weight precision')
    }

    const scale = 10 ** precision

    const ranges = [
        options.bidQualityWeight,
        options.prizeValueWeight,
        options.winningOpportunityWeight,
    ]

    const bounds = ranges.map((range) => {
        if (
            !Number.isFinite(range.min) ||
            !Number.isFinite(range.max) ||
            range.min > range.max
        ) {
            throw new RangeError('Invalid round weight range')
        }

        return {
            min: toMinimumTick(range.min, scale),
            max: toMaximumTick(range.max, scale),
        }
    })

    const first = bounds[0]
    const second = bounds[1]
    const third = bounds[2]

    if (
        first === undefined ||
        second === undefined ||
        third === undefined
    ) {
        throw new Error('Could not read round weight ranges')
    }

    // Select the first weight while ensuring the other two
    // can still add up to the remaining amount.
    const firstMin = Math.max(
        first.min,
        scale - second.max - third.max,
    )
    const firstMax = Math.min(
        first.max,
        scale - second.min - third.min,
    )

    if (firstMin > firstMax) {
        throw new RangeError('Round weight ranges cannot sum to 1')
    }

    const firstValue = getRandomInteger(firstMin, firstMax, random)

    // Select the second weight while ensuring the third
    // remains within its configured range.
    const secondMin = Math.max(
        second.min,
        scale - firstValue - third.max,
    )
    const secondMax = Math.min(
        second.max,
        scale - firstValue - third.min,
    )

    if (secondMin > secondMax) {
        throw new RangeError('Round weight ranges cannot sum to 1')
    }

    const secondValue = getRandomInteger(secondMin, secondMax, random)
    const thirdValue = scale - firstValue - secondValue

    return {
        bidQualityWeight: firstValue / scale,
        prizeValueWeight: secondValue / scale,
        winningOpportunityWeight: thirdValue / scale,
    }
}

export function generateStrategyConfig(
    options: StrategyGenerationOptions = DEFAULT_GENERATION_OPTIONS,
    random: Random = Math.random,
): StrategyConfig {
    const round = options.roundEvaluation

    validateIntegerRange(round.healthyCardCount)
    validateIntegerRange(round.minimumCardCount)

    const healthyCardCount = getRandomInteger(
        round.healthyCardCount.min,
        round.healthyCardCount.max,
        random,
    )

    const minimumCardCountMax = Math.min(
        round.minimumCardCount.max,
        healthyCardCount,
    )

    if (round.minimumCardCount.min > minimumCardCountMax) {
        throw new RangeError(
            'minimumCardCount cannot be generated at or below healthyCardCount',
        )
    }

    const minimumCardCount = getRandomInteger(
        round.minimumCardCount.min,
        minimumCardCountMax,
        random,
    )

    const weights = generateRoundWeights(round, random)

    return {
        roundEvaluation: {
            ...weights,
            cardStrengthExponent: generateNumber(
                round.cardStrengthExponent,
                random,
            ),
            healthyCardCount,
            minimumCardCount,
            maxDeckSustainabilityInfluence: generateNumber(
                round.maxDeckSustainabilityInfluence,
                random,
            ),
        },

        passEvaluation: {
            bidAdvantageWeight: generateNumber(
                options.passEvaluation.bidAdvantageWeight,
                random,
            ),
            winDesireWeight: generateNumber(
                options.passEvaluation.winDesireWeight,
                random,
            ),
        },

        cardEvaluation: {
            alignmentWeight: generateNumber(
                options.cardEvaluation.alignmentWeight,
                random,
            ),
            opportunityCostWeight: generateNumber(
                options.cardEvaluation.opportunityCostWeight,
                random,
            ),
            winDesirabilityThreshold: generateNumber(
                options.cardEvaluation.winDesirabilityThreshold,
                random,
            ),
            preferredLosingBidValue: generateNumber(
                options.cardEvaluation.preferredLosingBidValue,
                random,
            ),
            aceAlignment: generateNumber(
                options.cardEvaluation.aceAlignment,
                random,
            ),
            majorArcanaLosingAlignment: generateNumber(
                options.cardEvaluation.majorArcanaLosingAlignment,
                random,
            ),
            courtCardLosingAlignment: generateNumber(
                options.cardEvaluation.courtCardLosingAlignment,
                random,
            ),
            courtCardOpportunityCost: generateNumber(
                options.cardEvaluation.courtCardOpportunityCost,
                random,
            ),
            majorArcanaOpportunityCost: generateNumber(
                options.cardEvaluation.majorArcanaOpportunityCost,
                random,
            ),
            minorArcanaOpportunityCostFactor: generateNumber(
                options.cardEvaluation.minorArcanaOpportunityCostFactor,
                random,
            ),
        },
    }
}
