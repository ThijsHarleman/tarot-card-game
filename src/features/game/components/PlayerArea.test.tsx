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

function getCardIds(
    cards: readonly { id: string }[],
): ReadonlySet<string> {
    return new Set(cards.map((card) => card.id))
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
                legalCardIds={getCardIds([
                    ...player.hand,
                    ...player.courtCards,
                ])}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })

        expect(
            within(playerArea).getByRole('group', {
                name: "You's draw deck",
            }),
        ).toHaveTextContent('2')

        expect(
            within(playerArea).getAllByRole('button', {
                name: /^play /i,
            }),
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
                legalCardIds={getCardIds([
                    ...player.hand,
                    ...player.courtCards,
                ])}
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

    it('disables human cards that are not legal to play', () => {
        const player = createTestPlayer('player', 'You', 'wands')
        const legalCard = player.hand[0]!
        const illegalCard = player.hand[1]!

        render(
            <PlayerArea
                player={player}
                isActive
                isGameOver={false}
                isHuman
                onPlay={vi.fn()}
                legalCardIds={new Set([legalCard.id])}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })

        expect(
            within(playerArea).getByRole('button', {
                name: `Play ${legalCard.id}`,
            }),
        ).toBeEnabled()

        expect(
            within(playerArea).getByRole('button', {
                name: `Play ${illegalCard.id}`,
            }),
        ).toBeDisabled()
    })

    it('does not call onPlay when an illegal human card is clicked', async () => {
        const user = userEvent.setup()
        const player = createTestPlayer('player', 'You', 'wands')
        const onPlay = vi.fn()
        const illegalCard = player.hand[0]!

        render(
            <PlayerArea
                player={player}
                isActive
                isGameOver={false}
                isHuman
                onPlay={onPlay}
                legalCardIds={new Set()}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })

        await user.click(
            within(playerArea).getByRole('button', {
                name: `Play ${illegalCard.id}`,
            }),
        )

        expect(onPlay).not.toHaveBeenCalled()
    })

    it('disables court cards that are not legal to play', () => {
        const player = createTestPlayer('player', 'You', 'wands')
        const legalCourtCard = player.courtCards[0]!
        const illegalCourtCard = player.courtCards[1]!

        render(
            <PlayerArea
                player={player}
                isActive
                isGameOver={false}
                isHuman
                onPlay={vi.fn()}
                legalCardIds={new Set([legalCourtCard.id])}
            />,
        )

        const playerArea = screen.getByRole('region', { name: 'You' })

        expect(
            within(playerArea).getByRole('button', {
                name: `Play ${legalCourtCard.id}`,
            }),
        ).toBeEnabled()

        expect(
            within(playerArea).getByRole('button', {
                name: `Play ${illegalCourtCard.id}`,
            }),
        ).toBeDisabled()
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
