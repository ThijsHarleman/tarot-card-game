import { useEffect } from 'react'
import { randomStrategy } from '../../../game/opponent/randomStrategy'
import { executeOpponentDecision } from '../../../game/opponent/executeDecision'
import type { GameState } from '../../../game/game'

const OPPONENT_ACTION_DELAY_MS = 700

interface UseOpponentTurnOptions {
    game: GameState
    setGame: React.Dispatch<React.SetStateAction<GameState>>
}

export function useOpponentTurn({
    game,
    setGame,
}: UseOpponentTurnOptions): void {
    useEffect(() => {
        if (game.isGameOver || game.activePlayerId !== 'opponent') {
            return
        }

        const timeoutId = window.setTimeout(() => {
            const decision = randomStrategy.chooseAction(game)

            setGame((currentGame) =>
                executeOpponentDecision(currentGame, decision),
            )
        }, OPPONENT_ACTION_DELAY_MS)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [game, setGame])
}
