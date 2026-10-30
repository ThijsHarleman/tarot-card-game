import './PlayerArea.css'
import type { Player } from '../../../game/player'
import type { TarotCard } from '../../../game/cards/card'
import { getOwnedMajorArcana } from '../../../game/score'
import { CardBack } from '../../../components/CardBack'
import { PlayingCard } from '../../../components/PlayingCard'

interface PlayerAreaProps {
    player: Player
    isActive: boolean
    isGameOver: boolean
    isHuman: boolean
    onPlay: (card: TarotCard) => void
}

export function PlayerArea({
    player,
    isActive,
    isGameOver,
    isHuman,
    onPlay,
}: PlayerAreaProps) {
    const ownedMajorArcana = isGameOver ? [...getOwnedMajorArcana(player)].sort(
        (a, b) => a.number - b.number,
    ) : []

    return (
        <section
            className={`player-area${isActive && !isGameOver ? ' player-area--active' : ''}${isGameOver ? ' player-area--results' : ''}`}
            aria-label={player.name}
        >
            {isGameOver ? (
                <>
                    <h2>{player.name}</h2>
                    <div
                        className="owned-major-arcana"
                        role="group"
                        aria-label={`${player.name}'s Major Arcana`}
                    >
                        {ownedMajorArcana.map((card) => (
                            <div className="owned-major-arcana__card" key={card.id}>
                                <PlayingCard card={card} />
                            </div>
                        ))}

                        {ownedMajorArcana.length === 0 && (
                            <p className="empty-message">
                                No Major Arcana owned
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <div className="player-area__content">
                    <div className="player-area__identity">
                        <h2>{player.name}</h2>
                        <div className="player-piles">
                            <div
                                className="card-pile"
                                role="group"
                                aria-label={`${player.name}'s draw deck`}
                            >
                                <span>Deck</span>
                                <strong>{player.deck.length}</strong>
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
                    </div>

                    <div className="player-card-columns">
                        <section className="player-card-section">
                            <h2>Court</h2>
                            <div
                                className={`court-reserve${isHuman ? '' : ' court-reserve--opponent'}`}
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
                        </section>

                        <section className="player-card-section">
                            <h2>Hand</h2>
                            <div
                                className="hand"
                                role="group"
                                aria-label={`${player.name}'s hand`}
                            >
                                {isHuman ? (
                                    <>
                                        {player.hand.map((card, index) => (
                                            <button
                                                className="hand__card"
                                                key={`${card.id}-${index}`}
                                                onClick={() => onPlay(card)}
                                                aria-label={`Play ${card.id}`}
                                            >
                                                <PlayingCard card={card} />
                                            </button>
                                        ))}

                                        {player.hand.length === 0 && (
                                            <p>No cards in hand</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {player.hand.map((card, index) => (
                                            <CardBack
                                                key={`${card.id}-${index}`}
                                                index={index}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </section>
    )
}
