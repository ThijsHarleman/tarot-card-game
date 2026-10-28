import { describe, expect, it } from 'vitest'
import { getNextMajorArcana } from './getNextMajorArcana'
import type { MajorArcanaCard } from './card'

describe('getNextMajorArcana', () => {
    it('returns The Magician after The Fool', () => {
        const fool: MajorArcanaCard = {
            kind: 'major',
            id: 'major-0',
            name: 'The Fool',
            number: 0,
        }

        expect(getNextMajorArcana(fool)).toEqual({
            kind: 'major',
            id: 'major-1',
            name: 'The Magician',
            number: 1,
        })
    })

    it('returns The World after Judgement', () => {
        const judgement: MajorArcanaCard = {
            kind: 'major',
            id: 'major-20',
            name: 'Judgement',
            number: 20,
        }

        expect(getNextMajorArcana(judgement)).toEqual({
            kind: 'major',
            id: 'major-21',
            name: 'The World',
            number: 21,
        })
    })

    it('returns undefined after The World', () => {
        const world: MajorArcanaCard = {
            kind: 'major',
            id: 'major-21',
            name: 'The World',
            number: 21,
        }

        expect(getNextMajorArcana(world)).toBeUndefined()
    })
})
