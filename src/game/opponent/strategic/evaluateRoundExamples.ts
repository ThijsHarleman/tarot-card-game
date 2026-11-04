
import { MAJOR_ARCANA } from '../../cards/card'
import { createGame } from '../../game'
import type { GameState } from '../../game'
import type { MajorArcanaCard, Rank, Suit, TarotCard } from '../../cards/card'

export interface RoundEvaluationExample {
    readonly name: string
    /** Describes the situation from my perspective as the algorithm. */
    readonly description: string
    readonly state: GameState
    readonly minWinDesirability: number
    readonly maxWinDesirability: number
}

export function minor(suit: Suit, rank: Rank): TarotCard {
    return {
        kind: 'minor',
        id: `minor-${suit}-${rank}`,
        suit,
        rank,
    }
}

export function major(number: number): MajorArcanaCard {
    const name = MAJOR_ARCANA[number]

    if (name === undefined) {
        throw new RangeError(`Invalid Major Arcana number: ${number}`)
    }

    return {
        kind: 'major',
        id: `major-${number}`,
        name,
        number,
    }
}

/**
 * Creates placeholder cards for the discard pile.
 * Their identities do not matter for round evaluation;
 * only the number of available cards matters.
 */
function createDiscardCards(count: number): TarotCard[] {
    return Array.from(
        { length: count },
        () => minor('swords', 'two'),
    )
}

export function createExampleState(
    options: {
        readonly prizeNumber?: number
        readonly playedCards?: TarotCard[]
        readonly opponentDeck?: TarotCard[]
        readonly opponentHand?: TarotCard[]
        readonly opponentCourtCards?: TarotCard[]
        readonly opponentDiscardPile?: TarotCard[]
    } = {},
): GameState {
    const base = createGame('wands')

    return {
        ...base,
        activePlayerId: 'opponent',
        playedCards: options.playedCards ?? [],
        currentMajorArcana: major(options.prizeNumber ?? 0),
        opponent: {
            ...base.opponent,
            deck: options.opponentDeck ?? base.opponent.deck,
            hand: options.opponentHand ?? [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
            ],
            courtCards: options.opponentCourtCards ?? [],
            // Keep existing examples unaffected by deck sustainability.
            discardPile: options.opponentDiscardPile ?? createDiscardCards(20),
        },
    }
}

export const roundEvaluationExamples: readonly RoundEvaluationExample[] = [
    {
        name: 'Empty opening bid',
        description:
            'I have no information yet, ' +
            'so I should be relatively neutral about winning.',
        state: createExampleState(),
        minWinDesirability: 0.4,
        maxWinDesirability: 0.8,
    },
    {
        name: 'Collectively weak bid',
        description:
            'The human and I have only bid weak cards. I should prefer ' +
            'winning so I do not have to collect those cards when I pass.',
        state: createExampleState({
            playedCards: [
                minor('wands', 'two'),
                minor('cups', 'three'),
                minor('swords', 'four'),
            ],
        }),
        minWinDesirability: 0.5,
        maxWinDesirability: 1.0,
    },
    {
        name: 'Collectively strong bid',
        description:
            'The human and I have bid strong cards. I should prefer ' +
            'losing this round so I collect those cards when I pass.',
        state: createExampleState({
            prizeNumber: 2,
            playedCards: [
                minor('wands', 'queen'),
                minor('cups', 'king'),
                minor('swords', 'ten'),
            ],
            opponentHand: [
                minor('swords', 'queen'),
            ],
        }),
        minWinDesirability: 0.0,
        maxWinDesirability: 0.5,
    },
    {
        name: 'Most valuable prize',
        description:
            'The bid is unchanged, but the prize is The World, the highest-numbered Major Arcana. I should be more motivated to win this valuable prize.',
        state: createExampleState({
            prizeNumber: 21,
            playedCards: [
                minor('wands', 'five'),
                minor('cups', 'six'),
            ],
        }),
        minWinDesirability: 1.0,
        maxWinDesirability: 1.0,
    },
    {
        name: 'King available against a Queen',
        description:
            'The human has bid a Queen. I have a King available to outbid it, giving me a strong opportunity to win this round.',
        state: createExampleState({
            prizeNumber: 0,
            playedCards: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'four'),
                minor('swords', 'five'),
                minor('wands', 'queen'),
            ],
            opponentHand: [
                minor('swords', 'two'),
            ],
            opponentCourtCards: [minor('swords', 'king')],
        }),
        minWinDesirability: 0.5,
        maxWinDesirability: 1.0,
    },
    {
        name: 'No legal response',
        description:
            'The human has bid a Major Arcana. I only have non-Ace Minor Arcana, so I cannot legally outbid the human and should prefer to pass.',
        state: createExampleState({
            playedCards: [major(10)],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'four'),
            ],
            opponentCourtCards: [
                minor('swords', 'queen'),
            ],
        }),
        minWinDesirability: 0.0,
        maxWinDesirability: 0.5,
    },
    {
        name: 'Balanced position low prize',
        description: 'Balanced position low prize',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [
                minor('swords', 'two'),
                minor('swords', 'four'),
                minor('swords', 'six'),
                minor('swords', 'ten'),
                minor('swords', 'knight'),
            ],
            opponentHand: [
                minor('swords', 'two'),
            ],
            opponentCourtCards: [
                minor('swords', 'king'),
            ],
        }),
        minWinDesirability: 0.3,
        maxWinDesirability: 0.7,
    },
    {
        name: 'Balanced position medium prize',
        description: 'Balanced position medium prize',
        state: createExampleState({
            prizeNumber: 12,
            playedCards: [
                minor('swords', 'two'),
                minor('swords', 'four'),
                minor('swords', 'six'),
                minor('swords', 'ten'),
                minor('swords', 'knight'),
            ],
            opponentHand: [
                minor('swords', 'two'),
            ],
            opponentCourtCards: [
                minor('swords', 'king'),
            ],
        }),
        minWinDesirability: 0.5,
        maxWinDesirability: 0.9,
    },
    {
        name: 'Balanced position high prize',
        description: 'Balanced position high prize',
        state: createExampleState({
            prizeNumber: 19,
            playedCards: [
                minor('swords', 'two'),
                minor('swords', 'four'),
                minor('swords', 'six'),
                minor('swords', 'ten'),
                minor('swords', 'knight'),
            ],
            opponentHand: [
                minor('swords', 'two'),
            ],
            opponentCourtCards: [
                minor('swords', 'king'),
            ],
        }),
        minWinDesirability: 0.6,
        maxWinDesirability: 1,
    },
    {
        name: 'Low win chance, opening bid, low prize',
        description: 'Low win chance, opening bid, low prize',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'four'),
                minor('swords', 'five'),
                minor('swords', 'ten'),
            ],
            opponentCourtCards: [],
        }),
        minWinDesirability: 0,
        maxWinDesirability: 0.4,
    },
    {
        name: 'Low win chance, opening bid, medium prize',
        description: 'Low win chance, opening bid, medium prize',
        state: createExampleState({
            prizeNumber: 12,
            playedCards: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'four'),
                minor('swords', 'five'),
                minor('swords', 'ten'),
            ],
            opponentCourtCards: [
                minor('swords', 'page'),
            ],
        }),
        minWinDesirability: 0.3,
        maxWinDesirability: 0.7,
    },
    {
        name: 'Low win chance, opening bid, high prize',
        description: 'Low win chance, opening bid, high prize',
        state: createExampleState({
            prizeNumber: 18,
            playedCards: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'four'),
                minor('swords', 'five'),
                minor('swords', 'ten'),
            ],
            opponentCourtCards: [
                minor('swords', 'page'),
            ],
        }),
        minWinDesirability: 0.7,
        maxWinDesirability: 1,
    },
    {
        name: 'Has only Ace',
        description: 'Has only Ace',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [],
            opponentHand: [
                minor('swords', 'ace'),
            ],
        }),
        minWinDesirability: 0,
        maxWinDesirability: 0.3,
    },
    {
        name: 'High win chance, low bid, low prize',
        description: 'High win chance, low bid, low prize',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'four'),
            ],
            opponentHand: [
                major(2),
            ],
        }),
        minWinDesirability: 0.7,
        maxWinDesirability: 1,
    },

    // Deck sustainability examples

    {
        name: 'Healthy card supply',
        description:
            'I have 14 available cards. My supply is healthy, so deck ' +
            'sustainability should not influence my preference to win.',
        state: createExampleState({
            prizeNumber: 0,
            playedCards: [],
            opponentDeck: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
            ],
            opponentCourtCards: [],
            opponentDiscardPile: createDiscardCards(11),
        }),
        minWinDesirability: 0.7,
        maxWinDesirability: 0.9,
    },
    {
        name: 'Card supply approaching minimum',
        description:
            'I have 12 available cards. My supply is getting low, so I ' +
            'should be somewhat more willing to pass and collect the bid.',
        state: createExampleState({
            prizeNumber: 0,
            playedCards: [],
            opponentDeck: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
            ],
            opponentCourtCards: [],
            opponentDiscardPile: createDiscardCards(9),
        }),
        minWinDesirability: 0.4,
        maxWinDesirability: 0.7,
    },
    {
        name: 'Card supply at minimum',
        description:
            'I have only 10 available cards. I should strongly prefer ' +
            'passing and replenishing my supply, unless other factors ' +
            'make winning especially important.',
        state: createExampleState({
            prizeNumber: 0,
            playedCards: [],
            opponentDeck: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
            ],
            opponentCourtCards: [],
            opponentDiscardPile: createDiscardCards(7),
        }),
        minWinDesirability: 0.1,
        maxWinDesirability: 0.4,
    },
    {
        name: 'Depleted supply at the final prize',
        description:
            'My available card total is only 10, but the prize is The World. ' +
            'At the end of the game, deck sustainability should no longer ' +
            'influence my preference: winning the final prize takes priority.',
        state: createExampleState({
            prizeNumber: 21,
            playedCards: [],
            opponentDeck: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
            ],
            opponentCourtCards: [],
            opponentDiscardPile: createDiscardCards(7),
        }),
        minWinDesirability: 1.0,
        maxWinDesirability: 1.0,
    },
]
