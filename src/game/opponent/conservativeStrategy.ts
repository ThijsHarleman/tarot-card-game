
import { RANKS } from '../cards/card'
import type { TarotCard } from '../cards/card'
import { getLegalCards } from '../game'
import type { GameState } from '../game'
import type { OpponentDecision, OpponentStrategy } from './strategy'

const COURT_RANKS = new Set(['page', 'knight', 'queen', 'king'])

function isCourtCard(card: TarotCard): boolean {
    return card.kind === 'minor' && COURT_RANKS.has(card.rank)
}

function getCardValue(card: TarotCard): number {
    if (card.kind === 'major') {
        // Major Arcana rank above every Minor Arcana card.
        return RANKS.length + card.number
    }

    if (card.rank === 'ace') {
        // Preserve the Ace's flexibility for more valuable plays.
        return RANKS.indexOf('king') + 0.5
    }

    return RANKS.indexOf(card.rank)
}

function isProtectedMajorArcana(
    card: TarotCard,
    prizeValue: number,
): boolean {
    return card.kind === 'major' && card.number > prizeValue / 2
}

function shouldPass(state: GameState): boolean {
    const prizeValue = state.currentMajorArcana.number
    const bid = state.playedCards

    if (prizeValue <= 10) {
        const majorCount = bid.filter(
            (card) => card.kind === 'major',
        ).length

        const courtCount = bid.filter(isCourtCard).length

        return majorCount >= 1 || courtCount >= 2
    }

    const bidMajorValue = bid.reduce(
        (total, card) =>
            card.kind === 'major' ? total + card.number : total,
        0,
    )

    return bidMajorValue >= prizeValue / 3
}

export const conservativeStrategy: OpponentStrategy = {
    name: 'Conservative',

    chooseAction(state: GameState): OpponentDecision {
        const legalCards = getLegalCards(state)

        if (legalCards.length === 0) {
            return { type: 'pass' }
        }

        const prizeValue = state.currentMajorArcana.number

        // Rule 3: Never play a protected Major Arcana card.
        const playableCards = legalCards.filter(
            card => !isProtectedMajorArcana(card, prizeValue),
        )

        if (playableCards.length === 0) {
            return { type: 'pass' }
        }

        // Rule 4: For prizes worth 10 or less, preserve Court Cards
        // and Major Arcana once the bid contains a Major Arcana
        // or at least two Court Cards.
        if (prizeValue <= 10 && shouldPass(state)) {
            const restrictedCards = playableCards.filter(
                card => card.kind === 'major' || isCourtCard(card),
            )

            const unrestrictedCards = playableCards.filter(
                card => card.kind === 'minor' && !isCourtCard(card),
            )

            // If any unrestricted cards are available, play the
            // lowest-value one instead of a Court or Major Arcana.
            if (unrestrictedCards.length > 0) {
                const lowestCard = unrestrictedCards.reduce(
                    (lowest, card) =>
                        getCardValue(card) < getCardValue(lowest)
                            ? card
                            : lowest,
                )

                return { type: 'play', cardId: lowestCard.id }
            }

            // All remaining legal cards are restricted. Pass rather
            // than playing a Court Card or Major Arcana.
            if (restrictedCards.length > 0) {
                return { type: 'pass' }
            }
        }

        // Rule 5: At high prize values, do not pass while the
        // current bid's Major Arcana value is below one-third
        // of the prize. Otherwise, passing is allowed.
        if (prizeValue >= 11 && !shouldPass(state)) {
            // Continue to the normal lowest-value card selection.
        } else if (shouldPass(state)) {
            return { type: 'pass' }
        }

        // Rule 1: Play the lowest implicit-value legal card.
        const lowestCard = playableCards.reduce(
            (lowest, card) =>
                getCardValue(card) < getCardValue(lowest)
                    ? card
                    : lowest,
        )

        return { type: 'play', cardId: lowestCard.id }
    }
}
