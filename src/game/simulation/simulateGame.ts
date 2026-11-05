
import { SUITS } from '../cards/card'
import type { Suit } from '../cards/card'
import { createGame } from '../game'
import type { GameState } from '../game'
import { calculateScore } from '../score'
import { executeDecision } from '../opponent/executeDecision'
import type { OpponentStrategy } from '../opponent/strategy'

export interface GameResult {
    readonly player1Strategy: string
    readonly player2Strategy: string
    readonly player1Score: number
    readonly player2Score: number
    readonly winner: string
}

function getRandomSuit(): Suit {
    const index = Math.floor(Math.random() * SUITS.length)
    const suit = SUITS[index]

    if (suit === undefined) {
        throw new Error('Could not select a suit')
    }

    return suit
}

/**
 * Presents the active player as "opponent" so that existing opponent
 * strategies can make decisions from either seat.
 */
function createStrategyPerspective(state: GameState): GameState {
    const activePlayer =
        state.activePlayerId === 'player' ? state.player : state.opponent

    const inactivePlayer =
        state.activePlayerId === 'player' ? state.opponent : state.player

    return {
        ...state,
        player: { ...inactivePlayer, id: 'player' },
        opponent: { ...activePlayer, id: 'opponent' },
        activePlayerId: 'opponent',
    }
}

/**
 * Simulates one complete game.
 * Strategy 1 always controls player; strategy 2 always controls opponent.
 */
export function simulateGame(
    player1Strategy: OpponentStrategy,
    player2Strategy: OpponentStrategy,
): GameResult {
    let state = createGame(getRandomSuit())
    let actionCount = 0

    // Defensive guard against a broken strategy or an unexpected game loop.
    const MAX_ACTIONS = 1000

    while (!state.isGameOver) {
        actionCount += 1

        if (actionCount > MAX_ACTIONS) {
            throw new Error('Game exceeded the maximum number of actions')
        }

        const activeStrategy =
            state.activePlayerId === 'player'
                ? player1Strategy
                : player2Strategy

        const strategyState = createStrategyPerspective(state)
        const decision = activeStrategy.chooseAction(strategyState)

        state = executeDecision(state, decision, state.activePlayerId)
    }

    const player1Score = calculateScore(state.player)
    const player2Score = calculateScore(state.opponent)

    const winner = player1Score > player2Score
        ? player1Strategy.name
        : player2Strategy.name

    return {
        player1Strategy: player1Strategy.name,
        player2Strategy: player2Strategy.name,
        player1Score,
        player2Score,
        winner,
    }
}
