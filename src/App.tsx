import { useEffect, useRef, useState } from 'react'
import './App.css'
import type { Suit, TarotCard } from './game/cards/card'
import { createGame, passTurn, playCard } from './game/game'
import type { GameState } from './game/game'
import { AuctionArea } from './features/game/components/AuctionArea'
import { GameResults } from './features/game/components/GameResults'
import { HowToPlayModal } from './features/game/components/HowToPlayModal'
import { PlayerArea } from './features/game/components/PlayerArea'
import { SuitSelection } from './features/game/components/SuitSelection'
import { useOpponentTurn } from './features/game/hooks/useOpponentTurn'

function App() {
    const [selectedSuit, setSelectedSuit] = useState<Suit>('wands')
    const [game, setGame] = useState<GameState | null>(null)

    const howToPlayButtonRef = useRef<HTMLButtonElement>(null)
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
    const wasHowToPlayOpen = useRef(false)

    useOpponentTurn({ game, setGame })

    function handleStartGame() {
        setGame(createGame(selectedSuit))
    }

    function handlePlay(card: TarotCard) {
        setGame((currentGame) =>
            currentGame ? playCard(currentGame, card.id) : currentGame,
        )
    }

    function handlePass() {
        setGame((currentGame) =>
            currentGame ? passTurn(currentGame) : currentGame,
        )
    }

    function handleReset() {
        setGame(null)
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
                    {game !== null && (
                        <>
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
                        </>
                    )}
                </div>
            </header>

            {game === null ? (
                <SuitSelection
                    selectedSuit={selectedSuit}
                    onSuitChange={setSelectedSuit}
                    onStartGame={handleStartGame}
                    onHowToPlay={() => setIsHowToPlayOpen(true)}
                />
            ) : (
                <>
                    <PlayerArea
                        player={game.opponent}
                        isActive={game.activePlayerId === 'opponent'}
                        isGameOver={game.isGameOver}
                        isHuman={false}
                        onPlay={handlePlay}
                    />

                    {game.isGameOver ? (
                        <GameResults
                            player={game.player}
                            opponent={game.opponent}
                        />
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
                </>
            )}

            {isHowToPlayOpen && (
                <HowToPlayModal
                    onClose={() => setIsHowToPlayOpen(false)}
                />
            )}
        </main>
    )
}

export default App
