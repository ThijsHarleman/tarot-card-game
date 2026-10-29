
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGame } from '../../../game/game'
import { conservativeStrategy } from '../../../game/opponent/conservativeStrategy'
import { executeOpponentDecision } from '../../../game/opponent/executeDecision'
import { useOpponentTurn } from './useOpponentTurn'
import type { GameState } from '../../../game/game'

vi.mock('../../../game/opponent/conservativeStrategy', () => ({
    conservativeStrategy: {
        name: 'Conservative',
        chooseAction: vi.fn(),
    },
}))

vi.mock('../../../game/opponent/executeDecision', () => ({
    executeOpponentDecision: vi.fn(),
}))

describe('useOpponentTurn', () => {
    let game: GameState
    const setGame = vi.fn()

    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        game = createGame()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('does not schedule an action when it is the human player’s turn', () => {
        renderHook(() => useOpponentTurn({ game, setGame }))

        expect(vi.getTimerCount()).toBe(0)
        expect(conservativeStrategy.chooseAction).not.toHaveBeenCalled()
    })

    it('does not schedule an action when the game is over', () => {
        game = {
            ...game,
            activePlayerId: 'opponent',
            isGameOver: true,
        }

        renderHook(() => useOpponentTurn({ game, setGame }))

        expect(vi.getTimerCount()).toBe(0)
        expect(conservativeStrategy.chooseAction).not.toHaveBeenCalled()
    })

    it('chooses and executes an opponent action after the delay', () => {
        game = {
            ...game,
            activePlayerId: 'opponent',
        }

        const decision = { type: 'pass' } as const
        const nextGame = { ...game, activePlayerId: 'player' as const }

        vi.mocked(conservativeStrategy.chooseAction).mockReturnValue(decision)
        vi.mocked(executeOpponentDecision).mockReturnValue(nextGame)

        renderHook(() => useOpponentTurn({ game, setGame }))

        expect(conservativeStrategy.chooseAction).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(699)
        })

        expect(conservativeStrategy.chooseAction).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(1)
        })

        expect(conservativeStrategy.chooseAction).toHaveBeenCalledWith(game)
        expect(setGame).toHaveBeenCalledOnce()

        const stateUpdater = setGame.mock.calls[0]?.[0]
        expect(stateUpdater).toBeTypeOf('function')

        if (typeof stateUpdater === 'function') {
            const result = stateUpdater(game)

            expect(executeOpponentDecision).toHaveBeenCalledWith(game, decision)
            expect(result).toBe(nextGame)
        }
    })

    it('cancels the pending action when the hook unmounts', () => {
        game = {
            ...game,
            activePlayerId: 'opponent',
        }

        const { unmount } = renderHook(() => useOpponentTurn({ game, setGame }))

        expect(vi.getTimerCount()).toBe(1)

        unmount()

        expect(vi.getTimerCount()).toBe(0)

        act(() => {
            vi.advanceTimersByTime(700)
        })

        expect(conservativeStrategy.chooseAction).not.toHaveBeenCalled()
        expect(setGame).not.toHaveBeenCalled()
    })
})
