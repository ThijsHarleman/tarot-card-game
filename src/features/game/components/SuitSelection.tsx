
import { SUITS } from '../../../game/cards/card'
import type { Suit } from '../../../game/cards/card'
import './SuitSelection.css'

interface SuitSelectionProps {
    selectedSuit: Suit
    onSuitChange: (suit: Suit) => void
    onStartGame: () => void
    onHowToPlay: () => void
}

export function SuitSelection({
    selectedSuit,
    onSuitChange,
    onStartGame,
    onHowToPlay,
}: SuitSelectionProps) {
    return (
        <section
            className="suit-selection"
            aria-labelledby="suit-selection-title"
        >
            <h2>Compete against your opponent to collect Major Arcana cards.</h2>
            <h3 id="suit-selection-title">Choose your suit</h3>

            <div
                className="suit-selection__options"
                role="group"
                aria-label="Available suits"
            >
                {SUITS.map((suit) => (
                    <button
                        key={suit}
                        type="button"
                        className={`suit-option ${
                            selectedSuit === suit
                                ? 'suit-option--selected'
                                : ''
                        }`}
                        aria-pressed={selectedSuit === suit}
                        onClick={() => onSuitChange(suit)}
                    >
                        {suit.charAt(0).toUpperCase() + suit.slice(1)}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="suit-selection__start-button"
                onClick={onStartGame}
            >
                Start game
            </button>

            <button
                type="button"
                className="suit-selection__start-button"
                onClick={onHowToPlay}
            >
                How to play
            </button>
        </section>
    )
}
