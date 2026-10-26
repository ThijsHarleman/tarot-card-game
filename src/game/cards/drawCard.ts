import type { TarotCard } from './card'

export interface DrawResult {
    readonly card: TarotCard | undefined
    readonly remaining: TarotCard[]
}

export function drawCard(
    deck: readonly TarotCard[],
): DrawResult {
    const [card, ...remaining] = deck

    return {
        card,
        remaining,
    }
}
