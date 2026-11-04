import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TarotCard } from '../../cards/card'
import { createExampleState, minor } from './evaluateRoundExamples'
import type { CardActionEvaluation } from './evaluateCardActions'

const mocks = vi.hoisted(() => ({
    evaluateRound: vi.fn(),
    evaluatePassAction: vi.fn(),
    evaluateCardActions: vi.fn(),
}))

vi.mock('./evaluateRound', () => ({
    evaluateRound: mocks.evaluateRound,
}))

vi.mock('./evaluatePassAction', () => ({
    evaluatePassAction: mocks.evaluatePassAction,
}))

vi.mock('./evaluateCardActions', () => ({
    evaluateCardActions: mocks.evaluateCardActions,
}))

import { strategicStrategy } from './strategy'

function evaluation(
    card: TarotCard,
    score = 0.5,
): CardActionEvaluation {
    return {
        type: 'play',
        card,
        strategicAlignment: score,
        opportunityCost: 1 - score,
        score,
    }
}

describe('strategicStrategy', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mocks.evaluateRound.mockReturnValue({
            winDesirability: 0.5,
        })

        mocks.evaluatePassAction.mockReturnValue({
            bidQuality: 0.5,
            prizeValue: 0.5,
            winDesirability: 0.5,
            bidAdvantage: 0,
            passDesirability: 0,
        })

        mocks.evaluateCardActions.mockReturnValue([])
    })

    it('evaluates the round and passes its win desirability to both action evaluators', () => {
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'five')],
            opponentHand: [minor('swords', 'six')],
            opponentCourtCards: [],
        })

        const card = minor('swords', 'six')
        mocks.evaluateRound.mockReturnValue({ winDesirability: 0.75 })
        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 0,
        })
        mocks.evaluateCardActions.mockReturnValue([evaluation(card)])

        strategicStrategy.chooseAction(state)

        expect(mocks.evaluateRound).toHaveBeenCalledWith(state)
        expect(mocks.evaluatePassAction).toHaveBeenCalledWith(state, 0.75)
        expect(mocks.evaluateCardActions).toHaveBeenCalledWith(state, 0.75)
    })

    it('does not pass when a legal non-Ace Minor Arcana remains in hand', () => {
        const card = minor('swords', 'six')
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'five')],
            opponentHand: [card],
            opponentCourtCards: [],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 1,
        })
        mocks.evaluateCardActions.mockReturnValue([evaluation(card)])

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({
            type: 'play',
            cardId: card.id,
        })
    })

    it('does not pass when a legal court card remains against a Ten', () => {
        const page = minor('swords', 'page')
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'ten')],
            opponentHand: [],
            opponentCourtCards: [page],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 1,
        })
        mocks.evaluateCardActions.mockReturnValue([evaluation(page)])

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({
            type: 'play',
            cardId: page.id,
        })
    })

    it('can pass against a Queen even when a King is in the court reserve', () => {
        const king = minor('swords', 'king')
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'queen')],
            opponentHand: [],
            opponentCourtCards: [king],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 1,
        })

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({ type: 'pass' })
        expect(mocks.evaluateCardActions).not.toHaveBeenCalled()
    })

    it('passes when weighted selection chooses pass', () => {
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'king')],
            opponentHand: [],
            opponentCourtCards: [],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 1,
        })

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({ type: 'pass' })
        expect(mocks.evaluateCardActions).not.toHaveBeenCalled()
    })

    it('plays a card when weighted selection chooses not to pass', () => {
        const card = minor('swords', 'six')
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'king')],
            opponentHand: [card],
            opponentCourtCards: [],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 0,
        })
        mocks.evaluateCardActions.mockReturnValue([evaluation(card)])

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({
            type: 'play',
            cardId: card.id,
        })
    })

    it('uses weighted selection to choose between acceptable cards', () => {
        const lowerScoreCard = minor('swords', 'five')
        const higherScoreCard = minor('swords', 'six')

        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [minor('wands', 'king')],
            opponentHand: [lowerScoreCard, higherScoreCard],
            opponentCourtCards: [],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 0,
        })
        mocks.evaluateCardActions.mockReturnValue([
            evaluation(higherScoreCard, 0.9),
            evaluation(lowerScoreCard, 0.1),
        ])

        // A random value of 0.95 falls into the lower-scoring card's range.
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.95)

        try {
            const result = strategicStrategy.chooseAction(state)

            expect(result).toEqual({
                type: 'play',
                cardId: lowerScoreCard.id,
            })
        } finally {
            randomSpy.mockRestore()
        }
    })

    it('passes if no acceptable card actions remain', () => {
        const ace = minor('swords', 'ace')
        const state = createExampleState({
            prizeNumber: 10,
            playedCards: [],
            opponentHand: [ace],
            opponentCourtCards: [],
        })

        mocks.evaluatePassAction.mockReturnValue({
            passDesirability: 0,
        })
        mocks.evaluateCardActions.mockReturnValue([evaluation(ace)])

        const result = strategicStrategy.chooseAction(state)

        expect(result).toEqual({ type: 'pass' })
    })
})
