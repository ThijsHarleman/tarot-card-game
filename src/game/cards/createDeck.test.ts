import { describe, expect, it } from 'vitest'
import { MAJOR_ARCANA, RANKS, SUITS } from './card'
import { createDeck } from './createDeck'

describe('createDeck', () => {
    it('creates exactly 78 cards', () => {
        expect(createDeck()).toHaveLength(78)
    })

    it('contains all 22 major arcana cards', () => {
        const deck = createDeck()
        const majorCards = deck.filter(
            (card) => card.kind === 'major',
        )

        expect(majorCards).toHaveLength(22)
        expect(majorCards.map((card) => card.name)).toEqual(
            [...MAJOR_ARCANA],
        )
    })

    it('contains 14 cards for each of the four suits', () => {
        const deck = createDeck()
        const minorCards = deck.filter(
            (card) => card.kind === 'minor',
        )

        expect(minorCards).toHaveLength(56)

        for (const suit of SUITS) {
            const suitCards = minorCards.filter(
                (card) => card.suit === suit,
            )

            expect(suitCards).toHaveLength(14)
            expect(suitCards.map((card) => card.rank)).toEqual(
                [...RANKS],
            )
        }
    })

    it('gives every card a unique ID', () => {
        const deck = createDeck()
        const ids = deck.map((card) => card.id)

        expect(new Set(ids).size).toBe(78)
    })
})
