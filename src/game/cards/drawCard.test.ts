import { describe, expect, it } from 'vitest'
import { createPlayerDeck } from './createPlayerDeck'
import { drawCard } from './drawCard'

describe('drawCard', () => {
    it('draws the top card and returns the remaining deck', () => {
        const deck = createPlayerDeck(['wands', 'cups'])
        const result = drawCard(deck)

        expect(result.card?.id).toBe(deck[0].id)
        expect(result.remaining).toHaveLength(deck.length - 1)
        expect(result.remaining.map((card) => card.id)).toEqual(
            deck.slice(1).map((card) => card.id),
        )
    })

    it('does not mutate the original deck', () => {
        const deck = createPlayerDeck(['wands', 'cups'])
        const originalIds = deck.map((card) => card.id)

        drawCard(deck)

        expect(deck.map((card) => card.id)).toEqual(originalIds)
    })

    it('returns no card when the deck is empty', () => {
        const result = drawCard([])

        expect(result.card).toBeUndefined()
        expect(result.remaining).toEqual([])
    })

    it('draws the only card from a one-card deck', () => {
        const deck = createPlayerDeck(['wands', 'cups']).slice(0, 1)
        const result = drawCard(deck)

        expect(result.card?.id).toBe(deck[0].id)
        expect(result.remaining).toEqual([])
    })
})
