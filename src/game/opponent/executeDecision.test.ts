
import { describe, expect, it } from 'vitest'
import {
    createGame,
    getLegalCards,
    playCard,
} from '../game'
import { executeOpponentDecision } from './executeDecision'

function createOpponentTurn() {
    const initialState = createGame()
    const firstCard = getLegalCards(initialState)[0]

    if (firstCard === undefined) {
        throw new Error('Expected the player to have a legal opening card.')
    }

    return playCard(initialState, firstCard.id)
}

describe('executeOpponentDecision', () => {
    it('plays a legal card and returns the turn to the player', () => {
        const state = createOpponentTurn()
        const legalCards = getLegalCards(state)
        const card = legalCards[0]

        if (card === undefined) {
            throw new Error('Expected the opponent to have a legal card.')
        }

        const nextState = executeOpponentDecision(state, {
            type: 'play',
            cardId: card.id,
        })

        expect(nextState.playedCards).toHaveLength(2)
        expect(nextState.playedCards.at(-1)).toEqual(card)
        expect(nextState.activePlayerId).toBe('player')

        expect(
            nextState.opponent.hand.some((item) => item.id === card.id),
        ).toBe(false)

        expect(
            nextState.opponent.courtCards.some(
                (item) => item.id === card.id,
            ),
        ).toBe(false)
    })

    it('passes and resolves the round', () => {
        const state = createOpponentTurn()
        const playedCards = state.playedCards
        const currentPrize = state.currentMajorArcana

        const nextState = executeOpponentDecision(state, {
            type: 'pass',
        })

        expect(nextState.playedCards).toHaveLength(0)
        expect(nextState.activePlayerId).toBe('opponent')

        // The passing opponent receives the cards played in the round.
        for (const card of playedCards) {
            expect(
                nextState.opponent.discardPile.some(
                    (item) => item.id === card.id,
                ),
            ).toBe(true)
        }

        // The other player wins the current Major Arcana prize.
        expect(
            nextState.player.discardPile.some(
                (item) => item.id === currentPrize.id,
            ),
        ).toBe(true)

        expect(nextState.currentMajorArcana.number).toBe(
            currentPrize.number + 1,
        )
    })

    it('ignores an attempt to play an illegal card', () => {
        const state = createOpponentTurn()

        const nextState = executeOpponentDecision(state, {
            type: 'play',
            cardId: 'not-a-real-card',
        })

        expect(nextState).toBe(state)
    })

    it('ignores decisions when it is not the opponent’s turn', () => {
        const state = createGame()

        const nextState = executeOpponentDecision(state, {
            type: 'pass',
        })

        expect(nextState).toBe(state)
    })

    it('ignores decisions after the game has ended', () => {
        const state = createOpponentTurn()

        const finishedState = {
            ...state,
            isGameOver: true,
        }

        const nextState = executeOpponentDecision(finishedState, {
            type: 'pass',
        })

        expect(nextState).toBe(finishedState)
    })
})
