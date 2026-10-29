
import { useState } from 'react'
import './App.css'
import type { TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import { GameResults } from './features/game/components/GameResults'
import { PlayerArea } from './features/game/components/PlayerArea'
import { useOpponentTurn } from './features/game/hooks/useOpponentTurn'

function App() {
    const [game, setGame] = useState(createGame)

    useOpponentTurn({ game, setGame })

    function handlePlay(card: TarotCard) {
        setGame((currentGame) => playCard(currentGame, card.id))
    }

    function handlePass() {
        setGame((currentGame) => passTurn(currentGame))
    }

    function handleReset() {
        setGame(createGame())
    }

    return (
        <main className="game-table">
            <header className="game-header">
                <h1>Tarot Card Game</h1>
                <button className="new-game-button" onClick={handleReset}>
                    New game
                </button>
            </header>

            <PlayerArea
                player={game.opponent}
                isActive={game.activePlayerId === 'opponent'}
                isGameOver={game.isGameOver}
                isHuman={false}
                onPlay={handlePlay}
            />

            {game.isGameOver ? (
                <GameResults player={game.player} opponent={game.opponent} />
            ) : (
                <section className="play-area" aria-label="Auction area">
                    <div
                        className="current-prize"
                        role="group"
                        aria-label="Current Major Arcana prize"
                    >
                        <h2>Prize</h2>
                        <div className="major-arcana-card">
                            <span className="major-arcana-number">
                                {game.currentMajorArcana.number}
                            </span>
                            <strong>{game.currentMajorArcana.name}</strong>
                        </div>
                    </div>

                    <div
                        className="bidding-area"
                        role="group"
                        aria-label="Cards played this round"
                    >
                        <h2>Bids</h2>
                        <div className="played-cards">
                            {game.playedCards.map((card, index) => (
                                <div
                                    className={`played-card${
                                        game.activePlayerId === 'player' &&
                                        index === game.playedCards.length - 1
                                            ? ' played-card--latest'
                                            : ''
                                    }`}
                                    key={card.id}
                                >
                                    {card.kind === 'major' ? (
                                        <strong>{card.name}</strong>
                                    ) : (
                                        <span>
                                            {card.rank} of {card.suit}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {game.playedCards.length === 0 && (
                                <p>No bids yet</p>
                            )}
                        </div>
                    </div>

                    <button
                        className="pass-turn-button"
                        onClick={handlePass}
                        disabled={game.playedCards.length === 0}
                    >
                        Pass turn
                    </button>
                </section>
            )}

            <PlayerArea
                player={game.player}
                isActive={game.activePlayerId === 'player'}
                isGameOver={game.isGameOver}
                isHuman={true}
                onPlay={handlePlay}
            />
        </main>
    )
}

export default App
