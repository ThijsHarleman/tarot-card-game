import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayingCard } from './PlayingCard'

describe('PlayingCard', () => {
    it('displays a Major Arcana card', () => {
        render(
            <PlayingCard
                card={{
                    kind: 'major',
                    id: 'major-0',
                    name: 'The Fool',
                    number: 0,
                }}
            />,
        )

        expect(
            screen.getByRole('article', { name: 'The Fool' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Major Arcana')).toBeInTheDocument()
    })

    it('displays a Minor Arcana card', () => {
        render(
            <PlayingCard
                card={{
                    kind: 'minor',
                    id: 'minor-cups-ace',
                    suit: 'cups',
                    rank: 'ace',
                }}
            />,
        )

        expect(
            screen.getByRole('article', { name: 'Ace of Cups' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Minor Arcana')).toBeInTheDocument()
    })
})
