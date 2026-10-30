import './AuctionArea.css'
import type { TarotCard, MajorArcanaCard } from '../../../game/cards/card'
import { PlayingCard } from '../../../components/PlayingCard'

interface AuctionAreaProps {
    currentPrize: MajorArcanaCard
    playedCards: TarotCard[]
    isHumanTurn: boolean
    onPass: () => void
}

export function AuctionArea({
    currentPrize,
    playedCards,
    isHumanTurn,
    onPass,
}: AuctionAreaProps) {
    return (
        <section className="play-area" aria-label="Auction area">
            <div
                className="current-prize"
                role="group"
                aria-label="Current Major Arcana prize"
            >
                <h2>Prize</h2>
                <PlayingCard card={currentPrize} />

                <button
                    className="pass-turn-button"
                    onClick={onPass}
                    disabled={playedCards.length === 0}
                >
                    Pass
                </button>
            </div>

            <div
                className="bidding-area"
                role="group"
                aria-label="Cards played this round"
            >
                <h2>Bids</h2>
                <div className="played-cards">
                    {playedCards.map((card, index) => (
                        <div
                            className={`played-card${
                                isHumanTurn && index === playedCards.length - 1
                                    ? ' played-card--latest'
                                    : ''
                            }`}
                            key={card.id}
                        >
                            <PlayingCard card={card} />
                        </div>
                    ))}

                    {playedCards.length === 0 && <p>No bids yet</p>}
                </div>
            </div>
        </section>
    )
}
