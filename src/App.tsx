import { useState } from 'react'
import { PlayingCard } from './components/PlayingCard'
import { createDeck } from './game/cards/createDeck'
import { drawCard } from './game/cards/drawCard'
import { shuffleDeck } from './game/cards/shuffleDeck'
import { HAND_LIMIT } from './game/rules'
import type { TarotCard } from './game/cards/card'
import './App.css'

function App() {
    const [deck, setDeck] = useState<TarotCard[]>(
        () => shuffleDeck(createDeck()),
    )
    const [hand, setHand] = useState<TarotCard[]>([])
    const [playedCards, setPlayedCards] = useState<TarotCard[]>([])
    const [discardCount, setDiscardCount] = useState(0)

    function handleDrawCards() {
        const cardsToDraw = Math.min(HAND_LIMIT - hand.length, deck.length)

        if (cardsToDraw <= 0) {
            return
        }

        let remainingDeck = deck
        const newCards: TarotCard[] = []

        for (let i = 0; i < cardsToDraw; i++) {
            const result = drawCard(remainingDeck)

            if (result.card === undefined) {
                break
            }

            newCards.push(result.card)
            remainingDeck = result.remaining
        }

        setDeck(remainingDeck)
        setHand((currentHand) => [...currentHand, ...newCards])
    }

    function handlePlayCard(cardToPlay: TarotCard) {
        setHand((currentHand) =>
            currentHand.filter((card) => card.id !== cardToPlay.id),
        )
        setPlayedCards((currentPlayedCards) => [
            ...currentPlayedCards,
            cardToPlay,
        ])
    }

    function handleShuffleAndReset() {
        setDeck(shuffleDeck(createDeck()))
        setHand([])
        setPlayedCards([])
        setDiscardCount(0)
    }

    return (
        <main className="game-table">
            <header className="game-header">
                <div>
                    <p className="game-eyebrow">A tarot card game</p>
                    <h1>Tarot Table</h1>
                </div>

                <button
                    type="button"
                    className="reset-button"
                    onClick={handleShuffleAndReset}
                >
                    Shuffle &amp; reset
                </button>
            </header>

            <section className="table-half table-half--top" aria-label="Play area">
                <h2>Cards played this round</h2>

                {playedCards.length === 0 ? (
                    <p className="empty-message">No cards played yet.</p>
                ) : (
                    <div className="card-row card-row--played">
                        {playedCards.map((card) => (
                            <PlayingCard key={card.id} card={card} />
                        ))}
                    </div>
                )}
            </section>

            <section className="table-half table-half--bottom" aria-label="Your side">
                <div className="pile-area">
                    <button
                        type="button"
                        className="pile-button"
                        onClick={handleDrawCards}
                        disabled={hand.length >= HAND_LIMIT || deck.length === 0}
                        aria-label={`Draw cards. ${deck.length} cards remaining in deck`}
                    >
                        <span className="card-back" aria-hidden="true">
                            <span className="card-back__symbol">✦</span>
                        </span>
                        <span className="pile-label">Deck</span>
                        <span className="pile-count">{deck.length} cards</span>
                        <span className="pile-hint">
                            {hand.length >= HAND_LIMIT ? 'Hand full' : 'Click to draw'}
                        </span>
                    </button>
                </div>

                <div className="hand-area">
                    <div className="zone-heading">
                        <h2>Your hand</h2>
                        <span>
                            {hand.length} / {HAND_LIMIT}
                        </span>
                    </div>

                    {hand.length === 0 ? (
                        <p className="empty-message">Click the deck to draw cards.</p>
                    ) : (
                        <div className="card-row card-row--hand">
                            {hand.map((card) => (
                                <button
                                    key={card.id}
                                    type="button"
                                    className="hand-card-button"
                                    onClick={() => handlePlayCard(card)}
                                    aria-label={`Play ${getCardName(card)}`}
                                    title={`Play ${getCardName(card)}`}
                                >
                                    <PlayingCard card={card} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pile-area">
                    <div className="discard-pile" aria-label={`Discard pile: ${discardCount} cards`}>
                        <span className="discard-pile__symbol" aria-hidden="true">✧</span>
                    </div>
                    <span className="pile-label">Discard pile</span>
                    <span className="pile-count">{discardCount} cards</span>
                    <span className="pile-hint">Not in use yet</span>
                </div>
            </section>
        </main>
    )
}

function getCardName(card: TarotCard): string {
    if (card.kind === 'major') {
        return card.name
    }

    const rank = card.rank.charAt(0).toUpperCase() + card.rank.slice(1)
    const suit = card.suit.charAt(0).toUpperCase() + card.suit.slice(1)

    return `${rank} of ${suit}`
}

export default App
