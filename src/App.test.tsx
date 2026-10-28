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

    it('automatically fills both hands at the start of a game', () => {
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

        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)

        expect(
            within(opponentHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

        expect(
            screen.queryByRole('button', { name: /draw a card/i }),
        ).not.toBeInTheDocument()
    })

    it('plays a legal card and switches the active player', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        const cards = within(playerHand).getAllByRole('button', {
            name: /^play /i,
        })

        // The first card is legal because the play area is empty.
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

        // Playing a card removes it from the hand.
        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(4)

        // Drawing is not available during a round.
        expect(
            screen.queryByRole('button', { name: /draw a card/i }),
        ).not.toBeInTheDocument()
    })

    it('ends the round and gives the next round to the passing player', async () => {
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

        // You play a card, making the opponent active.
        const firstPlayerCard = within(playerHand).getAllByRole('button', {
            name: /^play /i,
        })[0]

        await user.click(firstPlayerCard)

        expect(
            screen.getByRole('heading', {
                name: /opponent — your turn/i,
            }),
        ).toBeInTheDocument()

        const playArea = screen.getByRole('region', {
            name: 'Cards played this round',
        })

        expect(within(playArea).getAllByRole('article')).toHaveLength(1)

        // The opponent passes, ending the round.
        await user.click(
            screen.getByRole('button', { name: /pass turn/i }),
        )

        // Played cards are cleared from the play area.
        expect(
            within(playArea).queryAllByRole('article'),
        ).toHaveLength(0)

        // The played card goes into the passing opponent's discard pile.
        const opponentDiscardPile = within(opponentArea).getByRole('group', {
            name: "Opponent's discard pile",
        })

        expect(
            within(opponentDiscardPile).getByText('1'),
        ).toBeInTheDocument()

        // Both players refill their hands for the next round.
        // The opponent's played card was not in their hand, so their
        // hand remains at five cards after the refill.
        expect(
            within(playerHand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)

        expect(
            within(opponentHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

        // The player who passed starts the next round.
        expect(
            screen.getByRole('heading', {
                name: /opponent — your turn/i,
            }),
        ).toBeInTheDocument()
    })

    it('starts a new game with full hands and populated court reserves', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        // Change the game state before resetting it.
        const firstPlayerCard = within(playerHand).getAllByRole('button', {
            name: /^play /i,
        })[0]

        await user.click(firstPlayerCard)

        await user.click(
            screen.getByRole('button', { name: /new game/i }),
        )

        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        const newPlayerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })
        const opponentHand = within(opponentArea).getByRole('group', {
            name: "Opponent's hand",
        })

        expect(
            within(newPlayerHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

        expect(
            within(opponentHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

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
        ).toHaveLength(4)

        expect(
            within(opponentCourtCards).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(4)

        expect(
            screen.getByText(/no cards played yet/i),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: /^You(?: — Your turn)?$/,
            }),
        ).toBeInTheDocument()
    })

    it('displays The Fool as the opening auction prize', () => {
        render(<App />)

        expect(
            screen.getByRole('group', { name: 'Current Major Arcana prize' }),
        ).toHaveTextContent('The Fool')

        expect(
            screen.getByRole('group', { name: 'Cards played this round' }),
        ).toHaveTextContent('No bids yet')
    })
})
