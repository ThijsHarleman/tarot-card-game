import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createPlayerCourtCards } from '../../../game/cards/createPlayerCourtCards'
import { createPlayerDeck } from '../../../game/cards/createPlayerDeck'
import type { Player } from '../../../game/player'
import { PlayerArea } from './PlayerArea'

function createTestPlayer(
    id: Player['id'],
    name: string,
    suit: 'wands' | 'swords',
): Player {
    const deck = createPlayerDeck(suit)

    return {
        id,
        name,
        deck: deck.slice(0, 2),
        hand: deck.slice(2, 5),
        courtCards: createPlayerCourtCards(suit),
        discardPile: [],
    }
}

describe('PlayerArea', () => {
    it('shows the player name, deck count, hand, and court cards', () => {
        const player = createTestPlayer('player', 'You', 'wands')

        render(
            <PlayerArea
                player={player}
                isActive
                isGameOver={false}
                isHuman
                onPlay={vi.fn()}
            />,
        )

        expect(
            screen.getByRole('heading', { name: 'You' }),
        ).toBeInTheDocument()

        const playerArea = screen.getByRole('region', { name: 'You' })

        expect(
            within(playerArea).getByRole('group', {
                name: "You's draw deck",
            }),
        ).toHaveTextContent('2')

        expect(
            within(playerArea).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(player.hand.length + player.courtCards.length)
    })

    it('calls onPlay with the selected human card', async () => {
        const user = userEvent.setup()
        const player = createTestPlayer('player', 'You', 'wands')
        const onPlay = vi.fn()

        render(
            <PlayerArea
                player={player}
                isActive
                isGameOver={false}
                isHuman
                onPlay={onPlay}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const firstCard = player.hand[0]

        expect(firstCard).toBeDefined()

        await user.click(
            within(playerArea).getByRole('button', {
                name: `Play ${firstCard!.id}`,
            }),
        )

        expect(onPlay).toHaveBeenCalledWith(firstCard)
    })

    it('does not make the opponent hand playable', () => {
        const opponent = createTestPlayer(
            'opponent',
            'Opponent',
            'swords',
        )

        render(
            <PlayerArea
                player={opponent}
                isActive={false}
                isGameOver={false}
                isHuman={false}
                onPlay={vi.fn()}
            />,
        )

        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        const hand = within(opponentArea).getByRole('group', {
            name: "Opponent's hand",
        })

        expect(
            within(hand).queryAllByRole('button', { name: /^play /i }),
        ).toHaveLength(0)

        expect(hand.querySelectorAll('.hand__card--hidden')).toHaveLength(
            opponent.hand.length,
        )

        expect(hand.querySelectorAll('.card-back')).toHaveLength(
            opponent.hand.length,
        )
    })

    it('shows owned Major Arcana instead of the normal player area after the game ends', () => {
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

        render(
            <PlayerArea
                player={player}
                isActive={false}
                isGameOver
                isHuman
                onPlay={vi.fn()}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })

        expect(
            within(playerArea).getByRole('group', {
                name: "You's Major Arcana",
            }),
        ).toHaveTextContent('The Hierophant')

        expect(
            within(playerArea).queryByRole('group', {
                name: "You's hand",
            }),
        ).not.toBeInTheDocument()
    })
})
