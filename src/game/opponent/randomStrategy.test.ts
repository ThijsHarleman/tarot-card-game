
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGame, getLegalCards, playCard } from '../game'
import { randomStrategy } from './randomStrategy'

function createOpponentTurn() {
    const initialState = createGame()
    const firstCard = getLegalCards(initialState)[0]

    if (firstCard === undefined) {
        throw new Error('Expected the player to have a legal opening card.')
    }

    return playCard(initialState, firstCard.id)
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('randomStrategy', () => {
    it('passes randomly when passing is allowed', () => {
        const state = createOpponentTurn()

        // The first random value determines whether to pass.
        vi.spyOn(Math, 'random').mockReturnValue(0.1)

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })

    it('plays a randomly selected legal card when it does not pass', () => {
        const state = createOpponentTurn()
        const legalCards = getLegalCards(state)

        expect(legalCards.length).toBeGreaterThan(0)

        // 0.9 avoids passing; 0 selects the first legal card.
        vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.9)
            .mockReturnValueOnce(0)

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: legalCards[0]!.id,
        })
    })

    it('chooses to pass when no legal cards are available', () => {
        const state = createOpponentTurn()

        const stateWithoutOpponentCards = {
            ...state,
            opponent: {
                ...state.opponent,
                hand: [],
                courtCards: [],
            },
        }

        expect(
            getLegalCards(stateWithoutOpponentCards),
        ).toHaveLength(0)

        expect(
            randomStrategy.chooseAction(stateWithoutOpponentCards),
        ).toEqual({
            type: 'pass',
        })
    })
})
