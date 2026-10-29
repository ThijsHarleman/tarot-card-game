import type { Player } from '../../../game/player'
import { calculateScore } from '../../../game/score'

interface GameResultsProps {
    player: Player
    opponent: Player
}

export function GameResults({
    player,
    opponent,
}: GameResultsProps) {
    const playerScore = calculateScore(player)
    const opponentScore = calculateScore(opponent)

    return (
        <section className="play-area game-results" aria-label="Game results">
            <div className="game-results__announcement">
                <h2>Game over</h2>
                <p>{playerScore > opponentScore ? 'You win!' : 'You lose.'}</p>
            </div>

            <div className="game-results__scores">
                <h2>Final scores</h2>
                <p>
                    <span>You</span>
                    <strong>{playerScore}</strong>
                </p>
                <p>
                    <span>Opponent</span>
                    <strong>{opponentScore}</strong>
                </p>
            </div>
        </section>
    )
}
