import { useEffect, useRef } from 'react'
import './HowToPlayModal.css'

interface HowToPlayModalProps {
    onClose: () => void
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
    const modalRef = useRef<HTMLElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const onCloseRef = useRef(onClose)

    // Keep the latest close callback without restarting the keyboard listener.
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        // Put keyboard focus inside the modal when it opens.
        closeButtonRef.current?.focus()

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault()
                onCloseRef.current()
                return
            }

            if (event.key !== 'Tab') {
                return
            }

            const modal = modalRef.current

            if (!modal) {
                return
            }

            const focusableElements = modal.querySelectorAll<HTMLElement>(
                'button:not(:disabled), a[href], input:not(:disabled), ' +
                'select:not(:disabled), textarea:not(:disabled), ' +
                '[tabindex]:not([tabindex="-1"])'
            )

            const firstElement = focusableElements.item(0)
            const lastElement = focusableElements.item(
                focusableElements.length - 1
            )

            if (!firstElement || !lastElement) {
                event.preventDefault()
                return
            }

            // Keep Tab and Shift+Tab navigation inside the modal.
            if (
                event.shiftKey &&
                (document.activeElement === firstElement ||
                    !modal.contains(document.activeElement))
            ) {
                event.preventDefault()
                lastElement.focus()
            } else if (
                !event.shiftKey &&
                (document.activeElement === lastElement ||
                    !modal.contains(document.activeElement))
            ) {
                event.preventDefault()
                firstElement.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    function handleBackdropMouseDown(
        event: React.MouseEvent<HTMLDivElement>
    ) {
        if (event.target === event.currentTarget) {
            onCloseRef.current()
        }
    }

    return (
        <div
            className="modal-backdrop"
            onMouseDown={handleBackdropMouseDown}
        >
            <section
                ref={modalRef}
                className="how-to-play-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="how-to-play-title"
            >
                <header className="how-to-play-modal__header">
                    <h2 id="how-to-play-title">How to play</h2>

                    <button
                        ref={closeButtonRef}
                        className="modal-close-button"
                        onClick={() => onCloseRef.current()}
                        aria-label="Close instructions"
                    >
                        &times;
                    </button>
                </header>

                <div className="how-to-play-modal__content">
                    <section>
                        <h3>Objective</h3>
                        <p>
                            Compete against your opponent to collect Major
                            Arcana cards. Each Major Arcana has a point value, 
                            and the player with the highest total score wins.
                        </p>
                    </section>

                    <section>
                        <h3>1. Preparation</h3>
                        <p>
                            This game uses the 78-card tarot deck.
                        </p>
                        <p>
                            Each player starts the game with a shuffled deck 
                            containing the Ace and all the numbered cards of 
                            one suit.
                        </p>
                        <p>
                            Each player also starts with the four 
                            Court cards of their suit face up before them.
                        </p>
                        <p>
                            The Major Arcana cards are sorted by rank and 
                            placed face up between both players, with The Fool 
                            as the prize for the first round.
                        </p>
                        <p>
                            The Minor Arcana cards of the two remaining suits 
                            not used by either player are placed aside. They 
                            are not used during the game.
                        </p>
                    </section>

                    <section>
                        <h3>2. Take your turn</h3>
                        <p>
                            Each player starts the round with a hand of five 
                            cards. On your turn, play a legal card to the 
                            bidding area or pass to end the round.
                        </p>
                        <p>
                            Your opponent will respond automatically after
                            you play a card.
                        </p>
                    </section>

                    <section>
                        <h3>3. Playing cards</h3>
                        <ul>
                            <li>
                                A played card must have a higher rank than the 
                                previous card.
                            </li>
                            <li>
                                An Ace can be played on any card, but it is
                                the lowest Minor Arcana rank otherwise.
                            </li>
                            <li>
                                Major Arcana cards outrank Minor Arcana cards.
                            </li>
                            <li>
                                Players can choose to play one of their Court 
                                cards, instead of playing a card from their 
                                hand.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3>4. Passing and winning a round</h3>
                        <p>
                            Once at least one card has been played, either
                            player can pass. Passing ends the round:
                        </p>
                        <ul>
                            <li>
                                The player who passes takes all cards in the
                                bidding area into their discard pile.
                            </li>
                            <li>
                                The other player wins the current Major
                                Arcana prize and adds it to their discard pile.
                            </li>
                            <li>
                                The next Major Arcana card becomes the prize.
                                The player who passed takes the next turn.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3>5. Court cards</h3>
                        <p>
                            Each player starts with a Page, Knight, Queen, and 
                            King card in their Court. Court cards can be played 
                            instead of playing a card from the hand. Cards can 
                            never re-enter the Court after having been played.
                        </p>
                    </section>

                    <section>
                        <h3>6. Scoring and the end of the game</h3>
                        <p>
                            The game ends after The World, the final Major
                            Arcana prize, has been won by either player. Your 
                            score is the sum of the numbers on all Major Arcana 
                            cards you own. The player with the highest total 
                            wins. A total of 231 points are available.
                        </p>
                    </section>
                </div>

                <footer className="how-to-play-modal__footer">
                    <button onClick={onClose}>Got it!</button>
                </footer>
            </section>
        </div>
    )
}
