export interface StrategyConfig {
    readonly roundEvaluation: {
        /** Importance of the quality of the cards already bid. */
        readonly bidQualityWeight: number

        /** Initial importance of the current prize. */
        readonly prizeValueWeight: number

        /** Importance of the opportunity to outbid the opponent. */
        readonly winningOpportunityWeight: number

        /** Controls how strongly card strength affects winning opportunity. */
        readonly cardStrengthExponent: number

        /** Available card total considered comfortably healthy. */
        readonly healthyCardCount: number

        /** Available card total at which depletion pressure is maximal. */
        readonly minimumCardCount: number

        /** Maximum reduction in win desirability due to card depletion. */
        readonly maxDeckSustainabilityInfluence: number
    }

    readonly passEvaluation: {
        /** Influence of the difference between bid quality and prize value. */
        readonly bidAdvantageWeight: number

        /** Influence of the desire to win on the decision to pass. */
        readonly winDesireWeight: number
    }

    readonly cardEvaluation: {
        /** Importance of how well a card aligns with the current goal. */
        readonly alignmentWeight: number

        /** Importance of preserving valuable cards. */
        readonly opportunityCostWeight: number

        /** Win desirability at which the strategy switches its card preference. */
        readonly winDesirabilityThreshold: number

        /** Preferred card strength when trying to lose a round. */
        readonly preferredLosingBidValue: number

        /** Alignment assigned to an Ace. */
        readonly aceAlignment: number

        /** Alignment assigned to a Major Arcana when trying to lose. */
        readonly majorArcanaLosingAlignment: number

        /** Alignment assigned to a court card when trying to lose. */
        readonly courtCardLosingAlignment: number

        /** Opportunity cost of spending a court card. */
        readonly courtCardOpportunityCost: number

        /** Opportunity cost of spending a Major Arcana. */
        readonly majorArcanaOpportunityCost: number

        /** Fraction of a Minor Arcana card's value used as opportunity cost. */
        readonly minorArcanaOpportunityCostFactor: number
    }
}

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
    roundEvaluation: {
        bidQualityWeight: 0.4,
        prizeValueWeight: 0.0,
        winningOpportunityWeight: 0.6,
        cardStrengthExponent: 2,
        healthyCardCount: 14,
        minimumCardCount: 10,
        maxDeckSustainabilityInfluence: 0.5,
    },

    passEvaluation: {
        bidAdvantageWeight: 0.4,
        winDesireWeight: 1,
    },

    cardEvaluation: {
        alignmentWeight: 0.7,
        opportunityCostWeight: 0.3,
        winDesirabilityThreshold: 0.5,
        preferredLosingBidValue: 0.65,
        aceAlignment: 0.1,
        majorArcanaLosingAlignment: 0.1,
        courtCardLosingAlignment: 0.2,
        courtCardOpportunityCost: 0.8,
        majorArcanaOpportunityCost: 1,
        minorArcanaOpportunityCostFactor: 0.5,
    },
}
