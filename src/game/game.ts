import type { TarotCard } from './cards/card'
import { MAJOR_ARCANA } from './cards/card'
import type { MajorArcanaCard } from './cards/card'
import { createPlayerCourtCards } from './cards/createPlayerCourtCards'
import { createPlayerDeck } from './cards/createPlayerDeck'
import { getNextMajorArcana } from './cards/getNextMajorArcana'
import { shuffleDeck } from './cards/shuffleDeck'
import { canPlayCard } from './cardRank'
import { HAND_LIMIT } from './rules'
import type { Player } from './player'

export interface GameState {
    readonly player: Player
    readonly opponent: Player
    readonly activePlayerId: Player['id']
    readonly playedCards: TarotCard[]
    readonly currentMajorArcana: MajorArcanaCard
    readonly isGameOver: boolean
}

export function createGame(): GameState {
    const initialState: GameState = {
        player: {
            id: 'player',
            name: 'You',
            deck: shuffleDeck(createPlayerDeck('wands')),
            hand: [],
            courtCards: createPlayerCourtCards('wands'),
            discardPile: [],
        },
        opponent: {
            id: 'opponent',
            name: 'Opponent',
            deck: shuffleDeck(createPlayerDeck('swords')),
            hand: [],
            courtCards: createPlayerCourtCards('swords'),
            discardPile: [],
        },
        activePlayerId: 'player',
        playedCards: [],
        currentMajorArcana: createMajorArcanaCard(0),
        isGameOver: false
    }

    return drawForPlayer(
        drawForPlayer(initialState, 'player'),
        'opponent',
    )
}

function createMajorArcanaCard(number: number): MajorArcanaCard {
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

/** Returns the active player's cards that can legally be played. */
export function getLegalCards(state: GameState): TarotCard[] {
    const player = getPlayer(state, state.activePlayerId)
    const previousCard = state.playedCards.at(-1)

    return [...player.hand, ...player.courtCards].filter(
        (card) => canPlayCard(card, previousCard),
    )
}

/** Plays a card if it belongs to the active player and follows the ranking rules. */
export function playCard(
    state: GameState,
    cardId: string,
): GameState {
    const player = getPlayer(state, state.activePlayerId)
    const card = getLegalCards(state).find((item) => item.id === cardId)

    if (card === undefined) return state

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
    if (state.playedCards.length === 0) {
        return state
    }

    const passingPlayerId = state.activePlayerId
    const winnerId = passingPlayerId === 'player' ? 'opponent' : 'player'

    const passingPlayer = getPlayer(state, passingPlayerId)
    const winner = getPlayer(state, winnerId)

    const updatedPassingPlayer: Player = {
        ...passingPlayer,
        discardPile: [
            ...passingPlayer.discardPile,
            ...state.playedCards,
        ],
    }

    const updatedWinner: Player = {
        ...winner,
        discardPile: [
            ...winner.discardPile,
            state.currentMajorArcana,
        ],
    }

    const stateWithDiscard = updatePlayer(
        updatePlayer(state, updatedPassingPlayer),
        updatedWinner,
    )

    const nextMajorArcana = getNextMajorArcana(state.currentMajorArcana)

    const nextState: GameState = {
        ...stateWithDiscard,
        playedCards: [],
        currentMajorArcana: nextMajorArcana ?? state.currentMajorArcana,
        isGameOver: nextMajorArcana === undefined,
        activePlayerId: passingPlayerId,
    }

    if (nextState.isGameOver) {
        return nextState
    }

    return drawForPlayer(
        drawForPlayer(nextState, 'player'),
        'opponent',
    )
}
