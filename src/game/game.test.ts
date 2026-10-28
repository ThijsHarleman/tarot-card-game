import { describe, expect, it } from 'vitest'
import { createGame, drawToHand, passTurn, playCard } from './game'
import type { Player } from './player'
import type { TarotCard } from './cards/card'
import { createPlayerDeck } from './cards/createPlayerDeck'
import { HAND_LIMIT } from './rules'

const ace: TarotCard = {
    kind: 'minor',
    id: 'minor-wands-ace',
    suit: 'wands',
    rank: 'ace',
}

const two: TarotCard = {
    kind: 'minor',
    id: 'minor-wands-two',
    suit: 'wands',
    rank: 'two',
}

const three: TarotCard = {
    kind: 'minor',
    id: 'minor-wands-three',
    suit: 'wands',
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
        courtCards: [],
        discardPile: [],
        ...overrides,
    }
}

describe('createGame', () => {
    it('creates two players with separate suits and full opening hands', () => {
        const game = createGame()

        expect(game.player.hand).toHaveLength(HAND_LIMIT)
        expect(game.opponent.hand).toHaveLength(HAND_LIMIT)

        expect(game.player.deck).toHaveLength(5)
        expect(game.opponent.deck).toHaveLength(5)

        expect(game.player.courtCards).toHaveLength(4)
        expect(game.opponent.courtCards).toHaveLength(4)

        expect(
            [...game.player.deck, ...game.player.hand].every(
                (card) => card.kind === 'minor' && card.suit === 'wands',
            ),
        ).toBe(true)

        expect(
            [...game.opponent.deck, ...game.opponent.hand].every(
                (card) => card.kind === 'minor' && card.suit === 'swords',
            ),
        ).toBe(true)

        expect(
            game.player.courtCards.every(
                (card) => card.kind === 'minor' && card.suit === 'wands',
            ),
        ).toBe(true)

        expect(
            game.opponent.courtCards.every(
                (card) => card.kind === 'minor' && card.suit === 'swords',
            ),
        ).toBe(true)

        const playerCardIds = [
            ...game.player.deck,
            ...game.player.hand,
            ...game.player.courtCards,
        ].map((card) => card.id)

        const opponentCardIds = [
            ...game.opponent.deck,
            ...game.opponent.hand,
            ...game.opponent.courtCards,
        ].map((card) => card.id)

        expect(new Set(playerCardIds).size).toBe(14)
        expect(new Set(opponentCardIds).size).toBe(14)

        expect(
            opponentCardIds.some((id) => playerCardIds.includes(id)),
        ).toBe(false)

        expect(game.activePlayerId).toBe('player')
        expect(game.playedCards).toEqual([])
    })

    it('starts the first auction with The Fool', () => {
        const game = createGame()

        expect(game.currentMajorArcana).toEqual({
            kind: 'major',
            id: 'major-0',
            name: 'The Fool',
            number: 0,
        })
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

    it('does not draw more than the hand limit', () => {
        const cards = createPlayerDeck('wands').slice(0, 7)

        const result = drawToHand(makePlayer({ deck: cards }))

        expect(result.hand).toHaveLength(HAND_LIMIT)
        expect(result.deck).toHaveLength(2)
    })

    it('does not draw if the hand is already full', () => {
        const cards = createPlayerDeck('wands')

        const player = makePlayer({
            hand: cards.slice(0, HAND_LIMIT),
            deck: cards.slice(HAND_LIMIT),
        })

        const result = drawToHand(player)

        expect(result.hand).toHaveLength(HAND_LIMIT)
        expect(result.deck).toHaveLength(5)
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

    it('does not play a card that is not in the active hand or reserve', () => {
        const game = createGame()

        const state = {
            ...game,
            player: makePlayer(),
        }

        expect(playCard(state, ace.id)).toBe(state)
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

    it('plays a court card directly from the reserve', () => {
        const game = createGame()
        const courtCard = game.player.courtCards[0]

        expect(courtCard).toBeDefined()
        if (courtCard === undefined) return

        const result = playCard(game, courtCard.id)

        expect(result.player.courtCards).toHaveLength(3)
        expect(result.player.courtCards).not.toContainEqual(courtCard)
        expect(result.playedCards).toContainEqual(courtCard)
        expect(result.activePlayerId).toBe('opponent')
    })
})

describe('passTurn', () => {
    it('moves played cards to the passing player, refills hands, and keeps them active', () => {
        const game = createGame()

        const state = {
            ...game,
            player: makePlayer({
                hand: [ace, two],
                deck: createPlayerDeck('wands').filter(
                    (card) => card.id !== ace.id && card.id !== two.id,
                ),
                discardPile: [],
            }),
            activePlayerId: 'player' as const,
            playedCards: [three],
        }

        const result = passTurn(state)

        // Played cards go to the passing player's discard pile.
        expect(result.player.discardPile).toContainEqual(three)

        // The play area is cleared for the new round.
        expect(result.playedCards).toEqual([])

        // The player who passed starts the next round.
        expect(result.activePlayerId).toBe('player')

        // Both hands refill up to the hand limit when cards are available.
        expect(result.player.hand).toHaveLength(HAND_LIMIT)
        expect(result.opponent.hand).toHaveLength(HAND_LIMIT)
    })

    it('recycles the passing player’s discard pile when refilling the next round', () => {
        const game = createGame()

        const state = {
            ...game,
            player: makePlayer({
                hand: [ace, two, three],
                deck: [],
                discardPile: [],
            }),
            activePlayerId: 'player' as const,
            playedCards: [],
        }

        const result = passTurn(state)

        // With no deck or discard cards available, the hand cannot refill.
        expect(result.player.hand).toEqual([ace, two, three])
        expect(result.player.deck).toEqual([])
        expect(result.player.discardPile).toEqual([])
        expect(result.activePlayerId).toBe('player')
    })

    it('awards the current Major Arcana to the player who did not pass', () => {
        const game = createGame()
        const result = passTurn({
            ...game,
            activePlayerId: 'player',
            playedCards: [three],
        })

        expect(result.player.discardPile).toContainEqual(three)
        expect(result.opponent.discardPile).toContainEqual(game.currentMajorArcana)
        expect(result.playedCards).toEqual([])
        expect(result.activePlayerId).toBe('player')
        expect(result.currentMajorArcana.name).toBe('The Magician')
    })

    it('awards the prize to the player and keeps the passer active', () => {
        const game = createGame()
        const result = passTurn({
            ...game,
            activePlayerId: 'opponent',
            playedCards: [three],
        })

        expect(result.opponent.discardPile).toContainEqual(three)
        expect(result.player.discardPile).toContainEqual(game.currentMajorArcana)
        expect(result.activePlayerId).toBe('opponent')
        expect(result.currentMajorArcana.name).toBe('The Magician')
    })
})
