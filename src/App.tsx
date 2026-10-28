
import { useState } from 'react'
import './App.css'
import type { Player } from './game/player'
import type { TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import { PlayingCard } from './components/PlayingCard'

function PlayerArea({
    player,
    isActive,
    onPlay,
}: {
    player: Player
    isActive: boolean
    onPlay: (card: TarotCard) => void
}) {
    return (
        <section
            className={`player-area${isActive ? ' player-area--active' : ''}`}
            aria-label={player.name}
        >
            <h2>{player.name}{isActive ? ' — Your turn' : ''}</h2>

            <div className="player-area__content">
                <div
                    className="card-pile"
                    role="group"
                    aria-label={`${player.name}'s draw deck`}
                >
                    <span>Deck</span>
                    <strong>{player.deck.length}</strong>
                </div>

                <div
                    className="court-reserve"
                    role="group"
                    aria-label={`${player.name}'s court cards`}
                >
                    {player.courtCards.map((card) => (
                        <button
                            className="court-reserve__card"
                            key={card.id}
                            onClick={() => onPlay(card)}
                            aria-label={`Play ${card.id}`}
                        >
                            <PlayingCard card={card} />
                        </button>
                    ))}
                    {player.courtCards.length === 0 && (
                        <p className="empty-message">No court cards remaining</p>
                    )}
                </div>

                <div
                    className="hand"
                    role="group"
                    aria-label={`${player.name}'s hand`}
                >
                    {player.hand.map((card, index) => (
                        <button
                            className="hand__card"
                            key={`${card.id}-${index}`}
                            onClick={() => onPlay(card)}
                            aria-label={`Play ${card.id}`}
                        >
                            <PlayingCard card={card} />
                        </button>
                    ))}
                    {player.hand.length === 0 && <p>No cards in hand</p>}
                </div>

                <div
                    className="card-pile card-pile--discard"
                    role="group"
                    aria-label={`${player.name}'s discard pile`}
                >
                    <span>Discard</span>
                    <strong>{player.discardPile.length}</strong>
                </div>
            </div>
        </section>
    )
}

function App() {
    const [game, setGame] = useState(createGame)

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
                <button onClick={handleReset}>New game</button>
            </header>

            <PlayerArea
                player={game.opponent}
                isActive={game.activePlayerId === 'opponent'}
                onPlay={handlePlay}
            />

            <section className="play-area" aria-label="Cards played this round">
                <h2>Cards played this round</h2>
                <div className="play-area__cards">
                    {game.playedCards.map((card, index) => (
                        <div key={`${card.id}-${index}`}>
                            <PlayingCard card={card} />
                        </div>
                    ))}
                    {game.playedCards.length === 0 && <p>No cards played yet</p>}
                </div>
                <button onClick={handlePass}>Pass turn</button>
            </section>

            <PlayerArea
                player={game.player}
                isActive={game.activePlayerId === 'player'}
                onPlay={handlePlay}
            />
        </main>
    )
}

export default App
