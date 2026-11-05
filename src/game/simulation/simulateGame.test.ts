
import { describe, expect, it, vi } from 'vitest'
import { simulateGame } from './simulateGame'
import type { OpponentDecision, OpponentStrategy } from '../opponent/strategy'

function createPassingStrategy(name: string): OpponentStrategy {
    return {
        name,
        chooseAction: vi.fn((): OpponentDecision => ({ type: 'pass' })),
    }
}

describe('simulateGame', () => {
    it('runs a complete game between two strategies', () => {
        const player1Strategy = createPassingStrategy('Strategy 1')
        const player2Strategy = createPassingStrategy('Strategy 2')

        const result = simulateGame(player1Strategy, player2Strategy)

        expect(result.player1Strategy).toBe('Strategy 1')
        expect(result.player2Strategy).toBe('Strategy 2')

        expect(result.player1Score).toBeGreaterThanOrEqual(0)
        expect(result.player2Score).toBeGreaterThanOrEqual(0)

        expect(
            result.player1Score + result.player2Score,
        ).toBe(231)

        expect(['Strategy 1', 'Strategy 2']).toContain(result.winner)

        expect(player1Strategy.chooseAction).toHaveBeenCalled()
        expect(player2Strategy.chooseAction).toHaveBeenCalled()
    })

    it('presents the active player as opponent to both strategies', () => {
        const player1Strategy = createPassingStrategy('Strategy 1')
        const player2Strategy = createPassingStrategy('Strategy 2')

        simulateGame(player1Strategy, player2Strategy)

        for (const strategy of [player1Strategy, player2Strategy]) {
            const calls = vi.mocked(strategy.chooseAction).mock.calls

            expect(calls.length).toBeGreaterThan(0)

            for (const [state] of calls) {
                expect(state.activePlayerId).toBe('opponent')
                expect(state.opponent.id).toBe('opponent')
                expect(state.player.id).toBe('player')
            }
        }
    })
})
