import { describe, expect, it } from 'vitest'
import { createGame } from '../../game'
import type { GameState } from '../../game'
import { evaluateRound } from './evaluateRound'

function createTestState(): GameState {
    return createGame('wands')
}

describe('evaluateRound', () => {
    it('returns normalized factors and a combined score', () => {
        const result = evaluateRound(createTestState())

        expect(result.winDesirability).toBeGreaterThanOrEqual(0)
        expect(result.winDesirability).toBeLessThanOrEqual(1)

        expect(result.bidQuality).toBeGreaterThanOrEqual(0)
        expect(result.bidQuality).toBeLessThanOrEqual(1)

        expect(result.prizeValue).toBeGreaterThanOrEqual(0)
        expect(result.prizeValue).toBeLessThanOrEqual(1)

        expect(result.winningOpportunity).toBeGreaterThanOrEqual(0)
        expect(result.winningOpportunity).toBeLessThanOrEqual(1)
    })

    it('prefers winning more when the prize is more valuable', () => {
        const state = createTestState()

        const earlyPrize = evaluateRound(state)

        const laterPrize = evaluateRound({
            ...state,
            currentMajorArcana: {
                ...state.currentMajorArcana,
                number: 21,
            },
        })

        expect(laterPrize.prizeValue).toBeGreaterThan(
            earlyPrize.prizeValue,
        )
        expect(laterPrize.winDesirability).toBeGreaterThan(
            earlyPrize.winDesirability,
        )
    })

    it('prefers winning more when the bid contains mostly weak cards', () => {
        const state = createTestState()

        const weakBid = evaluateRound({
            ...state,
            playedCards: [
                {
                    kind: 'minor',
                    id: 'minor-wands-two',
                    suit: 'wands',
                    rank: 'two',
                },
                {
                    kind: 'minor',
                    id: 'minor-cups-three',
                    suit: 'cups',
                    rank: 'three',
                },
            ],
        })

        const strongBid = evaluateRound({
            ...state,
            playedCards: [
                {
                    kind: 'minor',
                    id: 'minor-wands-queen',
                    suit: 'wands',
                    rank: 'queen',
                },
                {
                    kind: 'minor',
                    id: 'minor-cups-king',
                    suit: 'cups',
                    rank: 'king',
                },
            ],
        })

        expect(weakBid.bidQuality).toBeLessThan(
            strongBid.bidQuality,
        )
        expect(weakBid.winDesirability).toBeGreaterThan(
            strongBid.winDesirability,
        )
    })
})
