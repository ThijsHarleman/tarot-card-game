
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

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        expect(
            within(playerArea).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for Opponent' }),
        )

        const opponentArea = screen.getByRole('region', { name: /opponent/i })
        expect(
            within(opponentArea).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)
    })

    it('plays a legal card and switches the active player', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const cards = within(playerArea).getAllByRole('button', {
            name: /^play /i,
        })

        // Try each card until one is accepted. The initial card is always legal.
        let played = false

        for (const card of cards) {
            await user.click(card)

            const playArea = screen.getByRole('region', {
                name: 'Cards played this round',
            })

            if (within(playArea).queryAllByRole('article').length > 0) {
                played = true
                break
            }
        }

        expect(played).toBe(true)
        expect(
            screen.getByRole('heading', { name: /opponent — your turn/i }),
        ).toBeInTheDocument()

        expect(
            within(playerArea).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(4)
    })

    it('moves played cards to the passing player’s discard pile', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: 'Draw a card for You' }),
        )

        const playerArea = screen.getByRole('region', { name: 'You' })
        const cards = within(playerArea).getAllByRole('button', {
            name: /^play /i,
        })

        // Play the first card, which must be legal when the play area is empty.
        await user.click(cards[0])

        const playArea = screen.getByRole('region', {
            name: 'Cards played this round',
        })
        expect(within(playArea).getAllByRole('article')).toHaveLength(1)

        // The opponent is now active, so passing transfers the played card to them.
        await user.click(screen.getByRole('button', { name: /pass turn/i }))

        expect(
            within(playArea).queryAllByRole('article'),
        ).toHaveLength(0)

        const opponentArea = screen.getByRole('region', { name: /opponent/i })
        expect(
            within(opponentArea).getByText('1'),
        ).toBeInTheDocument()
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
        const opponentArea = screen.getByRole('region', { name: /opponent/i })

        expect(
            within(playerArea).queryAllByRole('button', { name: /^play /i }),
        ).toHaveLength(0)

        expect(
            within(opponentArea).queryAllByRole('button', { name: /^play /i }),
        ).toHaveLength(0)

        expect(
            screen.getByText(/no cards played yet/i),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: /^You(?: — Your turn)?$/ }),
        ).toBeInTheDocument()
    })
})
