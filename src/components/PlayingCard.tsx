import type { TarotCard } from '../game/cards/card'
import { toRomanNumeral } from '../game/romanNumerals'

interface PlayingCardProps {
    card: TarotCard
}

function formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export function PlayingCard({ card }: PlayingCardProps) {
    if (card.kind === 'major') {
        return (
            <article className="playing-card" aria-label={card.name}>
                <span className="playing-card__number">{toRomanNumeral(card.number)}</span>
                <h2 className="playing-card__name">{card.name}</h2>
                <span className="playing-card__category">Major Arcana</span>
            </article>
        )
    }

    return (
        <article
            className="playing-card"
            aria-label={`${formatLabel(card.rank)} of ${formatLabel(card.suit)}`}
        >
            <span className="playing-card__number">
                {formatLabel(card.rank)}
            </span>
            <h2 className="playing-card__name">{formatLabel(card.suit)}</h2>
            <span className="playing-card__category">Minor Arcana</span>
        </article>
    )
}
