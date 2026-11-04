import type { GameState } from '../../game'
import { createExampleState, minor } from './evaluateRoundExamples'

export interface CardActionExample {
    readonly name: string
    readonly description: string
    readonly state: GameState
    readonly winDesirability: number
    readonly expectedBestCardId: string
}

export const evaluateCardActionExamples: CardActionExample[] = [
    {
        name: 'Preserve the Ace when trying to win',
        description:
            'I want to win, but should preserve my flexible Ace if a low card is available.',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'five'),
                minor('swords', 'king'),
                minor('swords', 'ace'),
            ],
            opponentCourtCards: [],
        }),
        winDesirability: 0.8,
        expectedBestCardId: 'minor-swords-two',
    },
    {
        name: 'Play a low card when trying to win',
        description:
            'I want to win this round, so I should start with a low card.',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [],
            opponentHand: [
                minor('swords', 'two'),
                minor('swords', 'three'),
                minor('swords', 'king'),
            ],
            opponentCourtCards: [],
        }),
        winDesirability: 0.8,
        expectedBestCardId: 'minor-swords-two',
    },
    {
        name: 'Use a medium card when trying to lose',
        description:
            'I want to lose, so I should play a medium value card.',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [minor('wands', 'two')],
            opponentHand: [
                minor('swords', 'three'),
                minor('swords', 'six'),
                minor('swords', 'nine'),
                minor('swords', 'page'),
            ],
            opponentCourtCards: [
                minor('cups', 'page'),
            ],
        }),
        winDesirability: 0.2,
        expectedBestCardId: 'minor-swords-nine',
    },
    {
        name: 'Use a medium card when trying to lose',
        description:
            'I want to lose, so I should avoid spending court cards or Major Arcana unnecessarily.',
        state: createExampleState({
            prizeNumber: 5,
            playedCards: [minor('wands', 'four')],
            opponentHand: [
                minor('swords', 'six'),
                minor('swords', 'queen'),
            ],
            opponentCourtCards: [
                minor('swords', 'king'),
            ],
        }),
        winDesirability: 0.2,
        expectedBestCardId: 'minor-swords-six',
    },
]
