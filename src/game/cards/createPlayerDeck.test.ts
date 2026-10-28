
import { describe, expect, it } from 'vitest'
import { createPlayerDeck } from './createPlayerDeck'

describe('createPlayerDeck', () => {
    it('creates 10 minor arcana cards for 1 suit', () => {
        const deck = createPlayerDeck('wands')

        expect(deck).toHaveLength(10)
        expect(deck.every((card) => card.kind === 'minor')).toBe(true)
        expect(
            deck.every(
                (card) => card.suit === 'wands' || card.suit === 'cups',
            ),
        ).toBe(true)
    })

    it('includes every rank from the selected suit', () => {
        const deck = createPlayerDeck('wands')

        expect(deck.filter((card) => card.suit === 'wands')).toHaveLength(10)
    })

    it('does not include Major Arcana', () => {
        const deck = createPlayerDeck('swords')

        expect(deck.every((card) => card.kind === 'minor')).toBe(true)
    })
})
