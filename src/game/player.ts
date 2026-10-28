import type { TarotCard } from './cards/card'

export interface Player {
    readonly id: 'player' | 'opponent'
    readonly name: string
    readonly deck: TarotCard[]
    readonly hand: TarotCard[]
    readonly discardPile: TarotCard[]
}
