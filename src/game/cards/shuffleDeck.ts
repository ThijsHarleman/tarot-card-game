import type { TarotCard } from './card'

export function shuffleDeck(
    deck: readonly TarotCard[],
    random: () => number = Math.random,
): TarotCard[] {
    const shuffled = [...deck]

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))

            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
}
