
import { describe, expect, it } from 'vitest'
import { createPlayerDeck } from './createPlayerDeck'

describe('createPlayerDeck', () => {
    it('creates 28 minor arcana cards for two suits', () => {
        const deck = createPlayerDeck(['wands', 'cups'])

        expect(deck).toHaveLength(20)
        expect(deck.every((card) => card.kind === 'minor')).toBe(true)
        expect(
            deck.every(
                (card) => card.suit === 'wands' || card.suit === 'cups',
            ),
        ).toBe(true)
    })

    it('includes every rank from both selected suits', () => {
        const deck = createPlayerDeck(['wands', 'cups'])

        for (const suit of ['wands', 'cups'] as const) {
            expect(
                deck.filter((card) => card.kind === 'minor' && card.suit === suit),
            ).toHaveLength(10)
        }
    })

    it('does not include Major Arcana', () => {
        const deck = createPlayerDeck(['swords', 'pentacles'])

        expect(deck.every((card) => card.kind === 'minor')).toBe(true)
    })
})
