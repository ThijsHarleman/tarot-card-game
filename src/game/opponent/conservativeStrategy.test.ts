
import { describe, expect, it } from 'vitest'
import type { TarotCard, MajorArcanaCard } from '../cards/card'
import { MAJOR_ARCANA, RANKS } from '../cards/card'
import { createGame } from '../game'
import type { GameState } from '../game'
import { conservativeStrategy } from './conservativeStrategy'

function makeMajor(number: number): MajorArcanaCard {
    const name = MAJOR_ARCANA[number]

    if (name === undefined) {
        throw new RangeError(`Invalid Major Arcana number: ${number}`)
    }

    return {
        kind: 'major',
        id: `major-${number}`,
        name,
        number,
    }
}

function makeMinor(rank: (typeof RANKS)[number]): TarotCard {
    return {
        kind: 'minor',
        id: `minor-swords-${rank}`,
        suit: 'swords',
        rank,
    }
}

function makeState(
    prizeValue: number,
    hand: TarotCard[],
    playedCards: TarotCard[] = [],
): GameState {
    const game = createGame()

    return {
        ...game,
        activePlayerId: 'opponent',
        currentMajorArcana: makeMajor(prizeValue),
        playedCards,
        opponent: {
            ...game.opponent,
            hand,
            courtCards: [],
        },
    }
}

describe('conservativeStrategy', () => {
    it('plays the lowest strategic-value legal card', () => {
        const state = makeState(10, [
            makeMinor('five'),
            makeMinor('two'),
            makeMinor('ace'),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'minor-swords-two',
        })
    })

    it('does not play a Major Arcana worth more than half the prize', () => {
        const state = makeState(10, [
            makeMinor('five'),
            makeMajor(6),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'minor-swords-five',
        })
    })

    it('passes rather than playing a protected Major Arcana when it has no other option', () => {
        const state = makeState(10, [makeMajor(6)])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })

    it('plays rather than passing on a low-value prize when the bid has neither a Major Arcana nor two Court Cards', () => {
        const state = makeState(10, [makeMinor('two')], [
            makeMinor('ace'),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'minor-swords-two',
        })
    })

    it('passes on a low-value prize when the bid contains a Major Arcana', () => {
        const state = makeState(10, [makeMinor('two')], [
            makeMajor(1),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })

    it('passes on a high-value prize when the bid Major Arcana total is at least one-third of the prize', () => {
        const state = makeState(12, [makeMajor(5)], [
            makeMajor(4),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })

    it('plays when the bid Major Arcana total is below one-third of a high-value prize', () => {
        const state = makeState(12, [makeMajor(4)], [
            makeMajor(3),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'major-4',
        })
    })

    it('prefers an ordinary Minor Arcana over a Court Card when the Court Card would trigger a pass', () => {
        const state = makeState(10, [
            makeMinor('page'),
            makeMinor('two'),
            makeMinor('ace'),
        ], [
            makeMinor('ace'),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'minor-swords-two',
        })
    })

    it('prefers an ordinary Minor Arcana over a Major Arcana when the Major Arcana would trigger a pass', () => {
        const state = makeState(10, [
            makeMajor(3),
            makeMinor('two'),
        ], [
            makeMajor(1),
            makeMinor('ace'),
        ])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'play',
            cardId: 'minor-swords-two',
        })
    })

    it('passes when there are no legal cards', () => {
        const state = makeState(10, [])

        expect(conservativeStrategy.chooseAction(state)).toEqual({
            type: 'pass',
        })
    })
})
