import type { TarotCard } from './cards/card'
import { createPlayerCourtCards } from './cards/createPlayerCourtCards'
import { createPlayerDeck } from './cards/createPlayerDeck'
import { shuffleDeck } from './cards/shuffleDeck'
import { canPlayCard } from './cardRank'
import { HAND_LIMIT } from './rules'
import type { Player } from './player'

export interface GameState {
    readonly player: Player
    readonly opponent: Player
    readonly activePlayerId: Player['id']
    readonly playedCards: TarotCard[]
}

export function createGame(): GameState {
    return {
        player: {
            id: 'player',
            name: 'You',
            deck: shuffleDeck(createPlayerDeck(['wands', 'cups'])),
            hand: [],
            courtCards: createPlayerCourtCards(['wands', 'cups']),
            discardPile: [],
        },
        opponent: {
            id: 'opponent',
            name: 'Opponent',
            deck: shuffleDeck(createPlayerDeck(['swords', 'pentacles'])),
            hand: [],
            courtCards: createPlayerCourtCards(['swords', 'pentacles']),
            discardPile: [],
        },
        activePlayerId: 'player',
        playedCards: [],
    }
}

function updatePlayer(
    state: GameState,
    updatedPlayer: Player,
): GameState {
    return updatedPlayer.id === 'player'
        ? { ...state, player: updatedPlayer }
        : { ...state, opponent: updatedPlayer }
}

function getPlayer(state: GameState, playerId: Player['id']): Player {
    return playerId === 'player' ? state.player : state.opponent
}

function shuffleDiscardIntoDeck(player: Player): Player {
    return {
        ...player,
        deck: shuffleDeck([...player.discardPile]),
        discardPile: [],
    }
}

/** Draws until the hand is full or both the deck and discard pile are empty. */
export function drawToHand(player: Player): Player {
    let currentPlayer = player

    while (currentPlayer.hand.length < HAND_LIMIT) {
        if (currentPlayer.deck.length === 0) {
            if (currentPlayer.discardPile.length === 0) {
                break
            }

            currentPlayer = shuffleDiscardIntoDeck(currentPlayer)
        }

        const [card, ...remainingDeck] = currentPlayer.deck

        if (card === undefined) {
            break
        }

        currentPlayer = {
            ...currentPlayer,
            deck: remainingDeck,
            hand: [...currentPlayer.hand, card],
        }
    }

    return currentPlayer
}

export function drawForPlayer(
    state: GameState,
    playerId: Player['id'],
): GameState {
    const player = getPlayer(state, playerId)
    return updatePlayer(state, drawToHand(player))
}

/** Plays a card if it belongs to the active player and follows the ranking rules. */
export function playCard(
    state: GameState,
    cardId: string,
): GameState {
    const player = getPlayer(state, state.activePlayerId)
    const handCard = player.hand.find((item) => item.id === cardId)
    const courtCard = player.courtCards.find((item) => item.id === cardId)
    const card = handCard ?? courtCard
    const previousCard = state.playedCards.at(-1)

    if (card === undefined || !canPlayCard(card, previousCard)) return state

    const updatedPlayer: Player = {
        ...player,
        hand: player.hand.filter((item) => item.id !== cardId),
        courtCards: player.courtCards.filter((item) => item.id !== cardId),
    }

    const updatedState = updatePlayer(state, updatedPlayer)

    return {
        ...updatedState,
        playedCards: [...state.playedCards, card],
        activePlayerId: state.activePlayerId === 'player' ? 'opponent' : 'player',
    }
}

/** Passes the turn and moves all played cards into the passing player's discard pile. */
export function passTurn(state: GameState): GameState {
    const player = getPlayer(state, state.activePlayerId)

    const updatedPlayer: Player = {
        ...player,
        discardPile: [...player.discardPile, ...state.playedCards],
    }

    const updatedState = updatePlayer(state, updatedPlayer)

    return {
        ...updatedState,
        playedCards: [],
        activePlayerId: state.activePlayerId === 'player' ? 'opponent' : 'player',
    }
}
