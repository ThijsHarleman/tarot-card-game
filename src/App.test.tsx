import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
    it('starts with an empty hand and a full deck', () => {
        render(<App />)

        expect(screen.getByText('78 cards')).toBeInTheDocument()
        expect(screen.getByText('0 / 5')).toBeInTheDocument()
        expect(screen.getByText(/no cards played yet/i)).toBeInTheDocument()
    })

    it('draws up to the hand limit when the deck is clicked', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /draw cards/i }),
        )

        expect(screen.getByText('73 cards')).toBeInTheDocument()
        expect(screen.getByText('5 / 5')).toBeInTheDocument()

        expect(
            screen.getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(5)
    })

    it('plays one card from the hand', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /draw cards/i }),
        )

        const hand = screen.getByRole('region', { name: 'Your side' })
        const cardsBefore = within(hand).getAllByRole('button', {
            name: /^play /i,
        })

        await user.click(cardsBefore[0])

        expect(screen.getByText('4 / 5')).toBeInTheDocument()

        const playArea = screen.getByRole('region', { name: 'Play area' })
        expect(within(playArea).getAllByRole('article')).toHaveLength(1)
        expect(
            within(hand).getAllByRole('button', { name: /^play /i }),
        ).toHaveLength(4)
    })

    it('can draw again after playing a card', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /draw cards/i }),
        )

        const hand = screen.getByRole('region', { name: 'Your side' })
        await user.click(
            within(hand).getAllByRole('button', { name: /^play /i })[0],
        )

        await user.click(
            screen.getByRole('button', { name: /draw cards/i }),
        )

        expect(screen.getByText('5 / 5')).toBeInTheDocument()
        expect(screen.getByText('72 cards')).toBeInTheDocument()
    })

    it('resets the game when shuffling', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(
            screen.getByRole('button', { name: /draw cards/i }),
        )

        const hand = screen.getByRole('region', { name: 'Your side' })
        await user.click(
            within(hand).getAllByRole('button', { name: /^play /i })[0],
        )

        await user.click(
            screen.getByRole('button', { name: /shuffle & reset/i }),
        )

        expect(screen.getByText('78 cards')).toBeInTheDocument()
        expect(screen.getByText('0 / 5')).toBeInTheDocument()
        expect(screen.getByText(/no cards played yet/i)).toBeInTheDocument()
        expect(screen.getByText('0 cards')).toBeInTheDocument()
    })
})
