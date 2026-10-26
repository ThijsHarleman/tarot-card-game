export const SUITS = [
    'wands',
    'cups',
    'swords',
    'pentacles',
] as const

export type Suit = (typeof SUITS)[number]

export const RANKS = [
    'ace',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'page',
    'knight',
    'queen',
    'king',
] as const

export type Rank = (typeof RANKS)[number]

export const MAJOR_ARCANA = [
    'The Fool',
    'The Magician',
    'The High Priestess',
    'The Empress',
    'The Emperor',
    'The Hierophant',
    'The Lovers',
    'The Chariot',
    'Strength',
    'The Hermit',
    'Wheel of Fortune',
    'Justice',
    'The Hanged Man',
    'Death',
    'Temperance',
    'The Devil',
    'The Tower',
    'The Star',
    'The Moon',
    'The Sun',
    'Judgement',
    'The World',
] as const

export type MajorArcanaName = (typeof MAJOR_ARCANA)[number]

export interface MajorArcanaCard {
    readonly kind: 'major'
    readonly id: `major-${number}`
    readonly name: MajorArcanaName
    readonly number: number
}

export interface MinorArcanaCard {
    readonly kind: 'minor'
    readonly id: `minor-${Suit}-${Rank}`
    readonly suit: Suit
    readonly rank: Rank
}

export type TarotCard = MajorArcanaCard | MinorArcanaCard
