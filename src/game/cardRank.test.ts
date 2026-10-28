import { describe, expect, it } from 'vitest'
import type { TarotCard } from './cards/card'
import { canPlayCard, getCardRank } from './cardRank'

const aceOfCups: TarotCard = {
    kind: 'minor',
    id: 'minor-cups-ace',
    suit: 'cups',
    rank: 'ace',
}

const twoOfSwords: TarotCard = {
    kind: 'minor',
    id: 'minor-swords-two',
    suit: 'swords',
    rank: 'two',
}

const kingOfWands: TarotCard = {
    kind: 'minor',
    id: 'minor-wands-king',
    suit: 'wands',
    rank: 'king',
}

const fool: TarotCard = {
    kind: 'major',
    id: 'major-0',
    name: 'The Fool',
    number: 0,
}

const magician: TarotCard = {
    kind: 'major',
    id: 'major-1',
    name: 'The Magician',
    number: 1,
}

describe('getCardRank', () => {
    it('ranks the ace lowest', () => {
        expect(getCardRank(aceOfCups)).toBe(0)
    })

    it('ranks minor cards in the defined order', () => {
        expect(getCardRank(twoOfSwords)).toBe(1)
        expect(getCardRank(kingOfWands)).toBe(13)
    })

    it('ranks Major Arcana above every minor card', () => {
        expect(getCardRank(fool)).toBe(14)
        expect(getCardRank(magician)).toBe(15)
        expect(getCardRank(fool)).toBeGreaterThan(getCardRank(kingOfWands))
    })
})

describe('canPlayCard', () => {
    it('allows any card when the play area is empty', () => {
        expect(canPlayCard(aceOfCups)).toBe(true)
        expect(canPlayCard(kingOfWands)).toBe(true)
        expect(canPlayCard(fool)).toBe(true)
    })

    it('allows a higher-ranked card', () => {
        expect(canPlayCard(twoOfSwords, aceOfCups)).toBe(true)
        expect(canPlayCard(fool, kingOfWands)).toBe(true)
        expect(canPlayCard(magician, fool)).toBe(true)
    })

    it('rejects a lower or equal-ranked non-ace', () => {
        expect(canPlayCard(twoOfSwords, twoOfSwords)).toBe(false)
        expect(canPlayCard(fool, magician)).toBe(false)
    })

    it('allows an ace on any card, including another ace', () => {
        expect(canPlayCard(aceOfCups, kingOfWands)).toBe(true)
        expect(canPlayCard(aceOfCups, aceOfCups)).toBe(true)
        expect(canPlayCard(aceOfCups, fool)).toBe(true)
    })

    it('allows any non-ace after an ace', () => {
        expect(canPlayCard(twoOfSwords, aceOfCups)).toBe(true)
        expect(canPlayCard(kingOfWands, aceOfCups)).toBe(true)
        expect(canPlayCard(fool, aceOfCups)).toBe(true)
    })
})
