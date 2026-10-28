
import { describe, expect, it } from 'vitest'
import type { Player } from './player'
import type { MajorArcanaCard, MinorArcanaCard } from './cards/card'
import { calculateScore, getOwnedMajorArcana } from './score'

function makePlayer(overrides: Partial<Player> = {}): Player {
    return {
        id: 'player',
        name: 'You',
        deck: [],
        hand: [],
        courtCards: [],
        discardPile: [],
        ...overrides,
    }
}

const fool: MajorArcanaCard = {
    kind: 'major',
    id: 'major-0',
    name: 'The Fool',
    number: 0,
}

const magician: MajorArcanaCard = {
    kind: 'major',
    id: 'major-1',
    name: 'The Magician',
    number: 1,
}

const world: MajorArcanaCard = {
    kind: 'major',
    id: 'major-21',
    name: 'The World',
    number: 21,
}

const twoOfWands: MinorArcanaCard = {
    kind: 'minor',
    id: 'minor-wands-two',
    suit: 'wands',
    rank: 'two',
}

describe('getOwnedMajorArcana', () => {
    it('collects Major Arcana from the deck, hand, and discard pile', () => {
        const player = makePlayer({
            deck: [fool],
            hand: [twoOfWands, magician],
            discardPile: [world],
        })

        expect(getOwnedMajorArcana(player)).toEqual([
            fool,
            magician,
            world,
        ])
    })

    it('returns an empty array when the player owns no Major Arcana', () => {
        const player = makePlayer({
            hand: [twoOfWands],
        })

        expect(getOwnedMajorArcana(player)).toEqual([])
    })
})

describe('calculateScore', () => {
    it('sums the numbers of the owned Major Arcana', () => {
        const player = makePlayer({
            deck: [fool],
            hand: [magician],
            discardPile: [world],
        })

        expect(calculateScore(player)).toBe(22)
    })

    it('returns zero when the player owns no Major Arcana', () => {
        expect(calculateScore(makePlayer())).toBe(0)
    })

    it('does not count Minor Arcana or court cards', () => {
        const player = makePlayer({
            hand: [twoOfWands],
            courtCards: [
                {
                    kind: 'minor',
                    id: 'minor-wands-king',
                    suit: 'wands',
                    rank: 'king',
                },
            ],
        })

        expect(calculateScore(player)).toBe(0)
    })
})
