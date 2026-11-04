import { describe, expect, it } from 'vitest'
import type { GameState } from '../../game'
import type { TarotCard } from '../../cards/card'
import { createExampleState, major, minor } from './evaluateRoundExamples'
import type { CardActionEvaluation } from './evaluateCardActions'
import { filterCardActions } from './filterActions'

function evaluation(card: TarotCard): CardActionEvaluation {
    return {
        type: 'play',
        card,
        strategicAlignment: 0.5,
        opportunityCost: 0.5,
        score: 0.5,
    }
}

function filter(
    state: GameState,
    cards: TarotCard[],
): CardActionEvaluation[] {
    return filterCardActions(state, cards.map(evaluation))
}

describe('filterCardActions', () => {
    it('excludes an Ace when there are no previously bid cards', () => {
        const ace = minor('swords', 'ace')
        const two = minor('swords', 'two')

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [],
            opponentHand: [ace, two],
            opponentCourtCards: [],
        })

        const result = filter(state, [ace, two])

        expect(result.map(item => item.card.id)).toEqual([two.id])
    })

    it('excludes an Ace against a card below Page when another Minor Arcana is available', () => {
        const ace = minor('swords', 'ace')
        const two = minor('swords', 'two')
        const previousCard = minor('wands', 'ten')

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [previousCard],
            opponentHand: [ace, two],
            opponentCourtCards: [],
        })

        const result = filter(state, [ace, two])

        expect(result.map(item => item.card.id)).toEqual([two.id])
    })

    it('allows an Ace against a card below Page when no alternative Minor Arcana is available', () => {
        const ace = minor('swords', 'ace')
        const previousCard = minor('wands', 'ten')

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [previousCard],
            opponentHand: [ace],
            opponentCourtCards: [],
        })

        const result = filter(state, [ace])

        expect(result.map(item => item.card.id)).toEqual([ace.id])
    })

    it.each(['page', 'knight', 'queen', 'king'] as const)(
        'allows an Ace against a %s',
        rank => {
            const ace = minor('swords', 'ace')
            const previousCard = minor('wands', rank)

            const state = createExampleState({
                prizeNumber: 10,
                playedCards: [previousCard],
                opponentHand: [ace, minor('swords', 'two')],
                opponentCourtCards: [],
            })

            const result = filter(state, [ace])

            expect(result.map(item => item.card.id)).toEqual([ace.id])
        },
    )

    it('also considers court reserve cards when deciding whether to preserve an Ace', () => {
        const ace = minor('swords', 'ace')
        const page = minor('swords', 'page')
        const previousCard = minor('wands', 'ten')

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [previousCard],
            opponentHand: [ace],
            opponentCourtCards: [page],
        })

        const result = filter(state, [ace])

        expect(result).toEqual([])
    })

    it('excludes a Major Arcana whose number is greater than half the prize number', () => {
        const tooStrong = major(6)
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'five')],
            opponentHand: [],
            opponentCourtCards: [],
        })

        const result = filter(state, [tooStrong])

        expect(result).toEqual([])
    })

    it('allows a Major Arcana whose number is exactly half the prize number', () => {
        const acceptable = major(5)
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'five')],
            opponentHand: [],
            opponentCourtCards: [],
        })

        const result = filter(state, [acceptable])

        expect(result.map(item => item.card.id)).toEqual([acceptable.id])
    })

    it('preserves the original evaluation scores for cards that remain', () => {
        const two = minor('swords', 'two')
        const original = {
            ...evaluation(two),
            strategicAlignment: 0.8,
            opportunityCost: 0.2,
            score: 0.62,
        }

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [],
            opponentHand: [two],
            opponentCourtCards: [],
        })

        const result = filterCardActions(state, [original])

        expect(result).toEqual([original])
    })
})
