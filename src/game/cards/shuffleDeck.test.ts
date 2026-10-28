import { describe, expect, it } from 'vitest'
import { createPlayerDeck } from './createPlayerDeck'
import { shuffleDeck } from './shuffleDeck'

describe('shuffleDeck', () => {
    it('preserves every card exactly once', () => {
        const deck = createPlayerDeck(['wands', 'cups'])
        const shuffled = shuffleDeck(deck)

        expect(shuffled).toHaveLength(deck.length)
        expect(shuffled.map((card) => card.id).sort()).toEqual(
            deck.map((card) => card.id).sort(),
        )
    })

    it('does not mutate the original deck', () => {
        const deck = createPlayerDeck(['wands', 'cups'])
        const originalIds = deck.map((card) => card.id)

        shuffleDeck(deck)

        expect(deck.map((card) => card.id)).toEqual(originalIds)
    })

    it('uses the supplied random-number generator', () => {
        const deck = createPlayerDeck(['wands', 'cups']).slice(0, 3)
        const shuffled = shuffleDeck(deck, () => 0)

        expect(shuffled.map((card) => card.id)).toEqual([
            deck[1].id,
            deck[2].id,
            deck[0].id,
        ])
    })

    it('handles an empty deck', () => {
        expect(shuffleDeck([])).toEqual([])
    })

    it('handles a deck with one card', () => {
        const deck = [createPlayerDeck(['wands', 'cups'])[0]]

        expect(shuffleDeck(deck)).toEqual(deck)
    })
})
