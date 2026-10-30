
import { useEffect } from 'react'
import { conservativeStrategy } from '../../../game/opponent/conservativeStrategy'
import { executeOpponentDecision } from '../../../game/opponent/executeDecision'
import type { GameState } from '../../../game/game'

const OPPONENT_ACTION_DELAY_MS = 700

interface UseOpponentTurnOptions {
    game: GameState | null
    setGame: React.Dispatch<React.SetStateAction<GameState | null>>
}

export function useOpponentTurn({
    game,
    setGame,
}: UseOpponentTurnOptions): void {
    useEffect(() => {
        if (
            game === null ||
            game.isGameOver ||
            game.activePlayerId !== 'opponent'
        ) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            const decision = conservativeStrategy.chooseAction(game)

            setGame((currentGame) => {
                if (
                    currentGame === null ||
                    currentGame.isGameOver ||
                    currentGame.activePlayerId !== 'opponent'
                ) {
                    return currentGame
                }

                return executeOpponentDecision(currentGame, decision)
            })
        }, OPPONENT_ACTION_DELAY_MS)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [game, setGame])
}
