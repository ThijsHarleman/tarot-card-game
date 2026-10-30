
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createGame, passTurn } from './game/game'
import type { GameState } from './game/game'
import type { Player } from './game/player'

vi.mock('./features/game/components/PlayerArea', () => ({
    PlayerArea: ({
        player,
        isActive,
        isGameOver,
    }: {
        player: Player
        isActive: boolean
        isGameOver: boolean
    }) => (
        <section aria-label={player.name}>
            <h2>{player.name}</h2>
            <p>{isActive ? 'Active player' : 'Inactive player'}</p>
            {isGameOver && <p>Game finished</p>}
        </section>
    ),
}))

vi.mock('./features/game/components/AuctionArea', () => ({
    AuctionArea: ({
        currentPrize,
        playedCards,
        onPass,
    }: {
        currentPrize: GameState['currentMajorArcana']
        playedCards: GameState['playedCards']
        onPass: () => void
    }) => (
        <section aria-label="Auction area">
            <h2>Prize</h2>
            <p>{currentPrize.name}</p>
            <h2>Bids</h2>
            <p>{playedCards.length} cards played</p>
            <button onClick={onPass} disabled={playedCards.length === 0}>
                Pass
            </button>
        </section>
    ),
}))

vi.mock('./features/game/components/GameResults', () => ({
    GameResults: ({
        player,
        opponent,
    }: {
        player: Player
        opponent: Player
    }) => (
        <section aria-label="Game results">
            <h2>Game over</h2>
            <p>{player.name} vs {opponent.name}</p>
        </section>
    ),
}))

vi.mock('./features/game/hooks/useOpponentTurn', () => ({
    useOpponentTurn: vi.fn(),
}))

vi.mock('./game/game', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./game/game')>()

    return {
        ...actual,
        createGame: vi.fn(actual.createGame),
        passTurn: vi.fn(actual.passTurn),
    }
})

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the game screen and its main sections', () => {
        render(<App />)

        expect(
            screen.getByRole('heading', { name: 'Tarot Card Game' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: 'New game' }),
        ).toBeInTheDocument()

        expect(screen.getByRole('region', { name: 'Opponent' })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: 'You' })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: 'Auction area' })).toBeInTheDocument()
        expect(screen.getByText('The Fool')).toBeInTheDocument()
    })

    it('starts a new game when New game is clicked', async () => {
        const user = userEvent.setup()

        render(<App />)

        expect(createGame).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: 'New game' }))

        expect(createGame).toHaveBeenCalledTimes(2)
    })

    it('passes the current game state to the pass-turn rule', async () => {
        const user = userEvent.setup()

        const initialGame = createGame()
        const gameWithBids: GameState = {
            ...initialGame,
            playedCards: [
                {
                    kind: 'minor',
                    id: 'minor-wands-five',
                    suit: 'wands',
                    rank: 'five',
                },
            ],
        }

        const nextGame: GameState = {
            ...gameWithBids,
            playedCards: [],
            currentMajorArcana: {
                kind: 'major',
                id: 'major-1',
                name: 'The Magician',
                number: 1,
            },
        }

        vi.mocked(createGame).mockReturnValueOnce(gameWithBids)
        vi.mocked(passTurn).mockReturnValueOnce(nextGame)

        render(<App />)

        await user.click(screen.getByRole('button', { name: 'Pass' }))

        expect(passTurn).toHaveBeenCalledWith(gameWithBids)
        expect(screen.getByText('The Magician')).toBeInTheDocument()
        expect(screen.getByText('0 cards played')).toBeInTheDocument()
    })

    it('shows the game results when the game is over', () => {
        const initialGame = createGame()

        const finishedGame: GameState = {
            ...initialGame,
            isGameOver: true,
        }

        vi.mocked(createGame).mockReturnValueOnce(finishedGame)

        render(<App />)

        expect(screen.getByRole('region', { name: 'Game results' })).toBeInTheDocument()
        expect(screen.queryByRole('region', { name: 'Auction area' })).not.toBeInTheDocument()
    })
})
