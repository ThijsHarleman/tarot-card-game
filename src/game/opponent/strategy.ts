import type { GameState } from '../game'

export type OpponentDecision =
    | { type: 'pass' }
    | { type: 'play'; cardId: string }

export interface OpponentStrategy {
    readonly name: string

    chooseAction(state: GameState): OpponentDecision
}
