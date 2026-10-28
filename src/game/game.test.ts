import { describe, expect, it } from 'vitest'
import { createGame, drawToHand, passTurn, playCard } from './game'
import type { Player } from './player'
import type { TarotCard } from './cards/card'
import { createPlayerDeck } from './cards/createPlayerDeck'
import { HAND_LIMIT } from './rules'

const ace: TarotCard = {
    kind: 'minor',
    id: 'minor-cups-ace',
    suit: 'cups',
    rank: 'ace',
}

const two: TarotCard = {
    kind: 'minor',
    id: 'minor-cups-two',
    suit: 'cups',
    rank: 'two',
}

const three: TarotCard = {
    kind: 'minor',
    id: 'minor-cups-three',
    suit: 'cups',
    rank: 'three',
}

function makePlayer(
    overrides: Partial<Player> = {},
): Player {
    return {
        id: 'player',
        name: 'You',
        deck: [],
        hand: [],
        discardPile: [],
        ...overrides,
    }
}

describe('createGame', () => {
    it('creates two players with separate 78-card decks', () => {
        const game = createGame()

        expect(game.player.deck).toHaveLength(28)
        expect(game.opponent.deck).toHaveLength(28)

        expect(
            game.player.deck.every((card) => card.kind === 'minor'),
        ).toBe(true)

        expect(
            game.opponent.deck.every((card) => card.kind === 'minor'),
        ).toBe(true)

        const playerIds = new Set(game.player.deck.map((card) => card.id))

        expect(
            game.opponent.deck.every((card) => !playerIds.has(card.id)),
        ).toBe(true)
    })
})

describe('drawToHand', () => {
    it('draws up to the hand limit', () => {
        const player = makePlayer({
            deck: [ace, two, three],
        })

        const result = drawToHand(player)

        expect(result.hand).toEqual([ace, two, three])
        expect(result.deck).toEqual([])
    })

    it('recycles the discard pile when the deck is empty', () => {
        const player = makePlayer({
            discardPile: [ace, two, three],
        })

        const result = drawToHand(player)

        expect(result.hand).toHaveLength(3)
        expect(result.deck).toEqual([])
        expect(result.discardPile).toEqual([])
        expect(result.hand.map((card) => card.id).sort()).toEqual(
            [ace, two, three].map((card) => card.id).sort(),
        )
    })

    it('does not draw more than five cards', () => {
        const cards = createPlayerDeck(['wands', 'cups']).slice(0, 7)

        const result = drawToHand(makePlayer({ deck: cards }))

        expect(result.hand).toHaveLength(HAND_LIMIT)
        expect(result.deck).toHaveLength(2)
    })

    it('leaves an empty player unchanged when no cards are available', () => {
        const player = makePlayer()

        expect(drawToHand(player)).toEqual(player)
    })
})

describe('playCard', () => {
    it('plays a legal card and switches turns', () => {
        const game = createGame()
        const state = {
            ...game,
            player: makePlayer({ hand: [ace, two] }),
        }

        const result = playCard(state, ace.id)

        expect(result.player.hand).toEqual([two])
        expect(result.playedCards).toEqual([ace])
        expect(result.activePlayerId).toBe('opponent')
    })

    it('does not play a card that is not in the active hand', () => {
        const game = createGame()
        const result = playCard(game, ace.id)

        expect(result).toBe(game)
    })

    it('rejects a card that does not outrank the previous card', () => {
        const game = createGame()
        const state = {
            ...game,
            player: makePlayer({ hand: [two] }),
            playedCards: [three],
        }

        expect(playCard(state, two.id)).toBe(state)
    })

    it('allows an ace on any previously played card', () => {
        const game = createGame()
        const state = {
            ...game,
            player: makePlayer({ hand: [ace] }),
            playedCards: [three],
        }

        const result = playCard(state, ace.id)

        expect(result.playedCards).toEqual([three, ace])
        expect(result.activePlayerId).toBe('opponent')
    })
})

describe('passTurn', () => {
    it('moves played cards to the passing player and clears the play area', () => {
        const game = createGame()
        const state = {
            ...game,
            player: makePlayer({ discardPile: [ace] }),
            playedCards: [two, three],
        }

        const result = passTurn(state)

        expect(result.player.discardPile).toEqual([ace, two, three])
        expect(result.playedCards).toEqual([])
        expect(result.activePlayerId).toBe('opponent')
    })
})
