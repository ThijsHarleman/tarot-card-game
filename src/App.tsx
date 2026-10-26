import { useState } from 'react'
import { PlayingCard } from './components/PlayingCard'
import { createDeck } from './game/cards/createDeck'
import { drawCard } from './game/cards/drawCard'
import { shuffleDeck } from './game/cards/shuffleDeck'
import type { TarotCard } from './game/cards/card'
import './App.css'

function App() {
    const [deck, setDeck] = useState<TarotCard[]>(
        () => shuffleDeck(createDeck()),
    )
    const [drawnCards, setDrawnCards] = useState<TarotCard[]>([])

    function handleDrawCard() {
        const result = drawCard(deck)
        const card = result.card

        if (card === undefined) {
            return
        }

        setDeck(result.remaining)
        setDrawnCards((currentCards) => [...currentCards, card])
    }

    function handleShuffleAndReset() {
        setDeck(shuffleDeck(createDeck()))
        setDrawnCards([])
    }

    return (
        <main className="game">
            <header className="game__header">
                <p className="game__eyebrow">A deck of 78 cards</p>
                <h1>Tarot Table</h1>
                <p className="game__description">
                    Shuffle the deck, draw a card, and see what appears.
                </p>
            </header>

            <section className="game__controls" aria-label="Game controls">
                <button type="button" onClick={handleShuffleAndReset}>
                    Shuffle &amp; reset
                </button>

                <button
                    type="button"
                    onClick={handleDrawCard}
                    disabled={deck.length === 0}
                >
                    Draw a card
                </button>
            </section>

            <section className="game__status" aria-live="polite">
                <p>Cards remaining: {deck.length}</p>
                <p>Cards drawn: {drawnCards.length}</p>
            </section>

            <section className="game__hand" aria-label="Drawn cards">
                <h2>Your cards</h2>

                {drawnCards.length === 0 ? (
                    <p className="game__empty">
                        Your table is waiting. Draw a card to begin.
                    </p>
                ) : (
                    <div className="game__cards">
                        {drawnCards.map((card) => (
                            <PlayingCard key={card.id} card={card} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default App
