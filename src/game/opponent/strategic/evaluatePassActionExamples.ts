import type { GameState } from '../../game'
import { createExampleState, major, minor } from './evaluateRoundExamples'

export interface PassActionExample {
    readonly name: string
    readonly description: string
    readonly state: GameState
    readonly winDesirability: number
    readonly minPassDesirability: number
    readonly maxPassDesirability: number
}

export const evaluatePassActionExamples: PassActionExample[] = [
    {
        name: 'Strong desire to win',
        description:
            'I strongly want to win this round, so I should strongly prefer not to pass, even if the bid is valuable.',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [
                minor('wands', 'five'),
                minor('cups', 'queen'),
                minor('swords', 'king'),
            ],
            opponentHand: [minor('wands', 'two')],
            opponentCourtCards: [],
        }),
        winDesirability: 0.9,
        minPassDesirability: 0,
        maxPassDesirability: 0.3,
    },
    {
        name: 'Bid much more valuable than prize',
        description:
            'I want to lose this round, and the bid cards are collectively much more valuable than the prize. Passing should be attractive.',
        state: createExampleState({
            prizeNumber: 3,
            playedCards: [
                minor('wands', 'nine'),
                minor('cups', 'queen'),
                minor('swords', 'king'),
            ],
            opponentHand: [minor('wands', 'two')],
            opponentCourtCards: [],
        }),
        winDesirability: 0.1,
        minPassDesirability: 0.8,
        maxPassDesirability: 1,
    },
    {
        name: 'Prize much more valuable than bid',
        description:
            'I want to lose, but the prize is much more valuable than the bid cards. I should prefer not to pass.',
        state: createExampleState({
            prizeNumber: 20,
            playedCards: [
                minor('wands', 'two'),
                minor('cups', 'three'),
            ],
            opponentHand: [minor('wands', 'four')],
            opponentCourtCards: [],
        }),
        winDesirability: 0.1,
        minPassDesirability: 0,
        maxPassDesirability: 0.2,
    },
    {
        name: 'Bid and prize have similar value',
        description:
            'My desire to win is moderate, and the bid cards are roughly as valuable as the prize. Passing should be close to neutral.',
        state: createExampleState({
            prizeNumber: 10,
            playedCards: [
                minor('wands', 'six'),
                minor('cups', 'seven'),
                minor('cups', 'king'),
                major(2),
            ],
            opponentHand: [minor('wands', 'four')],
            opponentCourtCards: [],
        }),
        winDesirability: 0.5,
        minPassDesirability: 0.4,
        maxPassDesirability: 0.6,
    },
    {
        name: 'Strong desire to win with valuable prize',
        description:
            'I strongly want to win, and the prize is valuable. Passing should be particularly unattractive.',
        state: createExampleState({
            prizeNumber: 20,
            playedCards: [
                minor('wands', 'king'),
                minor('cups', 'queen'),
            ],
            opponentHand: [minor('wands', 'two')],
            opponentCourtCards: [],
        }),
        winDesirability: 1,
        minPassDesirability: 0,
        maxPassDesirability: 0.1,
    },
]
