
import { useState } from 'react'
import './App.css'
import type { TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import { AuctionArea } from './features/game/components/AuctionArea'
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
                <AuctionArea
                    currentPrize={game.currentMajorArcana}
                    playedCards={game.playedCards}
                    isHumanTurn={game.activePlayerId === 'player'}
                    onPass={handlePass}
                />
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
