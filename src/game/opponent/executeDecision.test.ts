
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

    it('plays a fallback card when asked to pass before the first bid', () => {
        const state = createGame()
        const legalCards = getLegalCards(state)

        expect(state.playedCards).toHaveLength(0)
        expect(state.activePlayerId).toBe('player')

        // Start an opponent turn without adding any cards to the bid.
        const opponentTurn = {
            ...state,
            activePlayerId: 'opponent' as const,
        }

        const opponentLegalCards = getLegalCards(opponentTurn)
        expect(opponentLegalCards.length).toBeGreaterThan(0)

        const nextState = executeOpponentDecision(opponentTurn, {
            type: 'pass',
        })

        // The fallback plays a card instead of attempting an illegal pass.
        expect(nextState.playedCards).toHaveLength(1)
        expect(nextState.activePlayerId).toBe('player')

        const playedCard = nextState.playedCards[0]
        expect(playedCard).toBeDefined()
        expect(
            opponentLegalCards.some((card) => card.id === playedCard?.id),
        ).toBe(true)

        expect(legalCards.length).toBeGreaterThan(0)
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
