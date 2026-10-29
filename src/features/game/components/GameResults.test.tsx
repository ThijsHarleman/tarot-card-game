import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Player } from '../../../game/player'
import { createPlayerDeck } from '../../../game/cards/createPlayerDeck'
import { createPlayerCourtCards } from '../../../game/cards/createPlayerCourtCards'
import { GameResults } from './GameResults'

function createTestPlayer(
    id: Player['id'],
    name: string,
    suit: 'wands' | 'swords',
): Player {
    return {
        id,
        name,
        deck: createPlayerDeck(suit),
        hand: [],
        courtCards: createPlayerCourtCards(suit),
        discardPile: [],
    }
}

describe('GameResults', () => {
    it('displays the final scores for both players', () => {
        const player: Player = {
            ...createTestPlayer('player', 'You', 'wands'),
            discardPile: [
                {
                    kind: 'major',
                    id: 'major-5',
                    name: 'The Hierophant',
                    number: 5,
                },
            ],
        }

        const opponent: Player = {
            ...createTestPlayer('opponent', 'Opponent', 'swords'),
            discardPile: [
                {
                    kind: 'major',
                    id: 'major-8',
                    name: 'Strength',
                    number: 8,
                },
            ],
        }

        render(<GameResults player={player} opponent={opponent} />)

        expect(
            screen.getByRole('heading', { name: 'Game over' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: 'Final scores' }),
        ).toBeInTheDocument()

        const results = screen.getByRole('region', {
            name: 'Game results',
        })

        expect(within(results).getByText('You')).toBeInTheDocument()
        expect(within(results).getByText('Opponent')).toBeInTheDocument()

        expect(
            within(results).getByText('5', { selector: 'strong' }),
        ).toBeInTheDocument()

        expect(
            within(results).getByText('8', { selector: 'strong' }),
        ).toBeInTheDocument()
    })

    it('announces a win when the human has the higher score', () => {
        const player: Player = {
            ...createTestPlayer('player', 'You', 'wands'),
            discardPile: [
                {
                    kind: 'major',
                    id: 'major-10',
                    name: 'Wheel of Fortune',
                    number: 10,
                },
            ],
        }

        const opponent = createTestPlayer('opponent', 'Opponent', 'swords')

        render(<GameResults player={player} opponent={opponent} />)

        expect(screen.getByText('You win!')).toBeInTheDocument()
    })

    it('announces a loss when the human does not have the higher score', () => {
        const player = createTestPlayer('player', 'You', 'wands')

        const opponent: Player = {
            ...createTestPlayer('opponent', 'Opponent', 'swords'),
            discardPile: [
                {
                    kind: 'major',
                    id: 'major-10',
                    name: 'Wheel of Fortune',
                    number: 10,
                },
            ],
        }

        render(<GameResults player={player} opponent={opponent} />)

        expect(screen.getByText('You lose.')).toBeInTheDocument()
    })
})
