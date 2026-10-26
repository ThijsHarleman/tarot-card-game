import {
    MAJOR_ARCANA,
    RANKS,
    SUITS,
    type TarotCard,
} from './card'

export function createDeck(): TarotCard[] {
    const majorCards: TarotCard[] = MAJOR_ARCANA.map(
        (name, index) => ({
            kind: 'major',
            id: `major-${index}`,
            name,
            number: index,
        }),
    )

    const minorCards: TarotCard[] = SUITS.flatMap((suit) =>
        RANKS.map((rank) => ({
            kind: 'minor' as const,
            id: `minor-${suit}-${rank}` as const,
            suit,
            rank,
        })),
    )

    return [...majorCards, ...minorCards]
}
