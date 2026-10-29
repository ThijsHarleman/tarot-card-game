
import type { TarotCard, MajorArcanaCard } from '../../../game/cards/card'

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
                <div className="major-arcana-card">
                    <span className="major-arcana-number">
                        {currentPrize.number}
                    </span>
                    <strong>{currentPrize.name}</strong>
                </div>
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
                            {card.kind === 'major' ? (
                                <strong>{card.name}</strong>
                            ) : (
                                <span>
                                    {card.rank} of {card.suit}
                                </span>
                            )}
                        </div>
                    ))}

                    {playedCards.length === 0 && <p>No bids yet</p>}
                </div>
            </div>

            <button
                className="pass-turn-button"
                onClick={onPass}
                disabled={playedCards.length === 0}
            >
                Pass turn
            </button>
        </section>
    )
}
