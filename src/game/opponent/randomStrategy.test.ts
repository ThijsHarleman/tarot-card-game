import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGame, getLegalCards, playCard } from '../game'
import { randomStrategy } from './randomStrategy'

function createOpponentTurn() {
    const initialState = createGame('wands')
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
    it('can select any legal card', () => {
        const state = createOpponentTurn()
        const legalCards = getLegalCards(state)

        expect(legalCards.length).toBeGreaterThan(0)

        // The random value 0 selects the first option.
        vi.spyOn(Math, 'random').mockReturnValue(0)

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: legalCards[0]!.id,
        })
    })

    it('can select the final legal card', () => {
        const state = createOpponentTurn()
        const legalCards = getLegalCards(state)

        expect(legalCards.length).toBeGreaterThan(0)

        // Select a value in the final card's interval, just before passing.
        vi.spyOn(Math, 'random').mockReturnValue(
            (legalCards.length - 0.5) / (legalCards.length + 1),
        )

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: legalCards[legalCards.length - 1]!.id,
        })
    })

    it('can select pass when passing is allowed', () => {
        const state = createOpponentTurn()
        const legalCards = getLegalCards(state)

        expect(legalCards.length).toBeGreaterThan(0)

        // The final option represents passing.
        vi.spyOn(Math, 'random').mockReturnValue(
            (legalCards.length + 0.5) / (legalCards.length + 1),
        )

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })

    it('does not pass on the opening turn', () => {
        const state = createGame('wands')
        const legalCards = getLegalCards(state)

        expect(legalCards.length).toBeGreaterThan(0)

        // The final legal card is selected at the upper end of the range.
        vi.spyOn(Math, 'random').mockReturnValue(0.999999)

        expect(randomStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: legalCards[legalCards.length - 1]!.id,
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

        // No random selection should be necessary.
        const randomSpy = vi.spyOn(Math, 'random')

        expect(
            randomStrategy.chooseAction(stateWithoutOpponentCards),
        ).toEqual({
            type: 'pass',
        })

        expect(randomSpy).not.toHaveBeenCalled()
    })
})
