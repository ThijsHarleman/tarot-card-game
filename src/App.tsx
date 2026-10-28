
import { useEffect, useState } from 'react'
import './App.css'
import type { Player } from './game/player'
import type { TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import { calculateScore, getOwnedMajorArcana } from './game/score'
import { randomStrategy } from './game/opponent/randomStrategy'
import { executeOpponentDecision } from './game/opponent/executeDecision'
import { PlayingCard } from './components/PlayingCard'

function PlayerArea({
    player,
    isActive,
    isGameOver,
    isHuman,
    onPlay,
}: {
    player: Player
    isActive: boolean
    isGameOver: boolean
    isHuman: boolean
    onPlay: (card: TarotCard) => void
}) {
    const ownedMajorArcana = isGameOver
        ? getOwnedMajorArcana(player)
        : []

    return (
        <section
            className={`player-area${isActive && !isGameOver ? ' player-area--active' : ''}${isGameOver ? ' player-area--results' : ''}`}
            aria-label={player.name}
        >
            <h2>
                {player.name}
                {isActive && !isGameOver ? ' — Your turn' : ''}
            </h2>

            {isGameOver ? (
                <div
                    className="owned-major-arcana"
                    role="group"
                    aria-label={`${player.name}'s Major Arcana`}
                >
                    {ownedMajorArcana.map((card) => (
                        <div className="owned-major-arcana__card" key={card.id}>
                            <span className="major-arcana-number">
                                {card.number}
                            </span>
                            <strong>{card.name}</strong>
                        </div>
                    ))}

                    {ownedMajorArcana.length === 0 && (
                        <p className="empty-message">
                            No Major Arcana owned
                        </p>
                    )}
                </div>
            ) : (
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
                        {player.courtCards.map((card) =>
                            isHuman ? (
                                <button
                                    className="court-reserve__card"
                                    key={card.id}
                                    onClick={() => onPlay(card)}
                                    aria-label={`Play ${card.id}`}
                                >
                                    <PlayingCard card={card} />
                                </button>
                            ) : (
                                <div className="court-reserve__card" key={card.id}>
                                    <PlayingCard card={card} />
                                </div>
                            ),
                        )}
                        {player.courtCards.length === 0 && (
                            <p className="empty-message">
                                No court cards remaining
                            </p>
                        )}
                    </div>

                    <div
                        className="hand"
                        role="group"
                        aria-label={`${player.name}'s hand`}
                    >
                        {player.hand.map((card, index) =>
                            isHuman ? (
                                <button
                                    className="hand__card"
                                    key={`${card.id}-${index}`}
                                    onClick={() => onPlay(card)}
                                    aria-label={`Play ${card.id}`}
                                >
                                    <PlayingCard card={card} />
                                </button>
                            ) : (
                                <div
                                    className="hand__card"
                                    key={`${card.id}-${index}`}
                                >
                                    <PlayingCard card={card} />
                                </div>
                            ),
                        )}
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
            )}
        </section>
    )
}

function GameResults({
    player,
    opponent,
}: {
    player: Player
    opponent: Player
}) {
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

function App() {
    const [game, setGame] = useState(createGame)

    useEffect(() => {
        if (game.isGameOver || game.activePlayerId !== 'opponent') {
            return
        }

        const decision = randomStrategy.chooseAction(game)

        setGame((currentGame) =>
            executeOpponentDecision(currentGame, decision),
        )
    }, [game])

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
                            {game.playedCards.map((card) => (
                                <div className="played-card" key={card.id}>
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
