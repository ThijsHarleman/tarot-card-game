import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
    it('shows both players, the play area, and a new-game button', () => {
        render(<App />)

        expect(
            screen.getByRole('heading', { name: 'Tarot Card Game' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: /^You(?: — Your turn)?$/ }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: 'Opponent' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('region', { name: 'Cards played this round' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /new game/i }),
        ).toBeInTheDocument()
    })

    it('draws up to the hand limit for either player', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })
        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })
        const opponentHand = within(opponentArea).getByRole('group', {
            name: "Opponent's hand",
        })

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)

        // Drawing for the opponent should also fill their hand to the limit.
        await user.click(
            screen.getByRole('button', {
                name: 'Draw a card for Opponent',
            }),
        )

        expect(
            within(opponentHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

        // Drawing again must not exceed the hand limit.
        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)
    })

    it('plays a legal card and switches the active player', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        const cards = within(playerHand).getAllByRole('button', {
            name: /^play /i,
        })

        // The play area is empty, so the first hand card is legal.
        await user.click(cards[0])

        const playArea = screen.getByRole('region', {
            name: 'Cards played this round',
        })

        expect(within(playArea).getAllByRole('article')).toHaveLength(1)

        expect(
            screen.getByRole('heading', {
                name: /opponent — your turn/i,
            }),
        ).toBeInTheDocument()

        // Playing a card should remove it from the player's hand.
        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(4)
    })

    it('moves played cards to the passing player’s discard pile', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        const firstCard = within(playerHand).getAllByRole('button', {
            name: /^play /i,
        })[0]

        // The first card is legal because the play area is empty.
        await user.click(firstCard)

        const playArea = screen.getByRole('region', {
            name: 'Cards played this round',
        })

        expect(within(playArea).getAllByRole('article')).toHaveLength(1)

        // The opponent is now active. Passing transfers the played card
        // to the passing player's discard pile.
        await user.click(
            screen.getByRole('button', { name: /pass turn/i }),
        )

        expect(
            within(playArea).queryAllByRole('article'),
        ).toHaveLength(0)

        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        // The discard pile displays its current card count.
        const discardPile = within(opponentArea).getByRole('group', {
            name: "Opponent's discard pile",
        })

        expect(within(discardPile).getByText('1')).toBeInTheDocument()
    })

    it('starts a new game when New game is clicked', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        await user.click(
            screen.getByRole('button', { name: /new game/i }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })
        const opponentHand = within(opponentArea).getByRole('group', {
            name: "Opponent's hand",
        })

        expect(
            within(playerHand).queryAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(0)

        expect(
            within(opponentHand).queryAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(0)

        // Starting a new game resets the hands and played cards,
        // but the court-card reserves should still be populated.
        const playerCourtCards = within(playerArea).getByRole('group', {
            name: "You's court cards",
        })
        const opponentCourtCards = within(opponentArea).getByRole('group', {
            name: "Opponent's court cards",
        })

        expect(
            within(playerCourtCards).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(8)

        expect(
            within(opponentCourtCards).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(8)

        expect(
            screen.getByText(/no cards played yet/i),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: /^You(?: — Your turn)?$/,
            }),
        ).toBeInTheDocument()
    })
})
