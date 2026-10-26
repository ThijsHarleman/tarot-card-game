import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
    it('starts with a full deck and no drawn cards', () => {
        render(<App />)

        expect(screen.getByText('Cards remaining: 78')).toBeInTheDocument()
        expect(screen.getByText('Cards drawn: 0')).toBeInTheDocument()
        expect(
            screen.getByText(/your table is waiting/i),
        ).toBeInTheDocument()
    })

    it('draws a card from the deck', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(screen.getByRole('button', { name: /draw a card/i }))

        expect(screen.getByText('Cards remaining: 77')).toBeInTheDocument()
        expect(screen.getByText('Cards drawn: 1')).toBeInTheDocument()
        expect(screen.getByRole('region', { name: 'Drawn cards' }))
            .toBeInTheDocument()
    })

    it('resets the game when shuffling', async () => {
        const user = userEvent.setup()
        render(<App />)

        await user.click(screen.getByRole('button', { name: /draw a card/i }))
        await user.click(
            screen.getByRole('button', { name: /shuffle & reset/i }),
        )

        expect(screen.getByText('Cards remaining: 78')).toBeInTheDocument()
        expect(screen.getByText('Cards drawn: 0')).toBeInTheDocument()
        expect(
            screen.getByText(/your table is waiting/i),
        ).toBeInTheDocument()
    })
})
