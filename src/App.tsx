import { useEffect, useRef, useState } from 'react'
import './App.css'
import type { TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import { AuctionArea } from './features/game/components/AuctionArea'
import { GameResults } from './features/game/components/GameResults'
import { HowToPlayModal } from './features/game/components/HowToPlayModal'
import { PlayerArea } from './features/game/components/PlayerArea'
import { useOpponentTurn } from './features/game/hooks/useOpponentTurn'

function App() {
    const [game, setGame] = useState(createGame)
    const howToPlayButtonRef = useRef<HTMLButtonElement>(null)
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
    const wasHowToPlayOpen = useRef(false)

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

    useEffect(() => {
        if (wasHowToPlayOpen.current && !isHowToPlayOpen) {
            howToPlayButtonRef.current?.focus()
        }

        wasHowToPlayOpen.current = isHowToPlayOpen
    }, [isHowToPlayOpen])

    return (
        <main className="game-table">
            <header className="game-header">
                <h1>Tarot Card Game</h1>

                <div className="game-header__actions">
                    <button
                        ref={howToPlayButtonRef}
                        className="how-to-play-button"
                        onClick={() => setIsHowToPlayOpen(true)}
                    >
                        How to play
                    </button>

                    <button
                        className="new-game-button"
                        onClick={handleReset}
                    >
                        New game
                    </button>
                </div>
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

            {isHowToPlayOpen && (
                <HowToPlayModal
                    onClose={() => setIsHowToPlayOpen(false)}
                />
            )}
        </main>
    )
}

export default App
