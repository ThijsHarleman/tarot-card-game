
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MajorArcanaCard, TarotCard } from '../../../game/cards/card'
import { AuctionArea } from './AuctionArea'

const prize: MajorArcanaCard = {
    kind: 'major',
    id: 'major-0',
    name: 'The Fool',
    number: 0,
}

const playedCards: TarotCard[] = [
    {
        kind: 'minor',
        id: 'minor-wands-five',
        suit: 'wands',
        rank: 'five',
    },
    {
        kind: 'major',
        id: 'major-5',
        name: 'The Hierophant',
        number: 5,
    },
]

describe('AuctionArea', () => {
    it('displays the current prize', () => {
        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={[]}
                isHumanTurn={true}
                onPass={vi.fn()}
            />,
        )

        expect(
            screen.getByRole('group', {
                name: 'Current Major Arcana prize',
            }),
        ).toHaveTextContent('0')
        expect(screen.getByText('The Fool')).toBeInTheDocument()
    })

    it('displays played Major and Minor Arcana cards', () => {
        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={playedCards}
                isHumanTurn={false}
                onPass={vi.fn()}
            />,
        )

        const bids = screen.getByRole('group', {
            name: 'Cards played this round',
        })

        expect(bids).toHaveTextContent('Five')
        expect(bids).toHaveTextContent('The Hierophant')
        expect(screen.queryByText('No bids yet')).not.toBeInTheDocument()
    })

    it('shows an empty-state message and disables passing when there are no bids', () => {
        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={[]}
                isHumanTurn={true}
                onPass={vi.fn()}
            />,
        )

        expect(screen.getByText('No bids yet')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Pass turn' }),
        ).toBeDisabled()
    })

    it('calls onPass when the pass button is clicked', async () => {
        const user = userEvent.setup()
        const onPass = vi.fn()

        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={playedCards}
                isHumanTurn={true}
                onPass={onPass}
            />,
        )

        await user.click(screen.getByRole('button', { name: 'Pass turn' }))

        expect(onPass).toHaveBeenCalledOnce()
    })

    it('highlights the latest played card when it becomes the human turn', () => {
        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={playedCards}
                isHumanTurn={true}
                onPass={vi.fn()}
            />,
        )

        const bids = screen.getByRole('group', {
            name: 'Cards played this round',
        })
        const cards = bids.querySelectorAll('.played-card')

        expect(cards).toHaveLength(2)
        expect(cards[0]).not.toHaveClass('played-card--latest')
        expect(cards[1]).toHaveClass('played-card--latest')
    })

    it('does not highlight the latest card when it is not the human turn', () => {
        render(
            <AuctionArea
                currentPrize={prize}
                playedCards={playedCards}
                isHumanTurn={false}
                onPass={vi.fn()}
            />,
        )

        expect(
            document.querySelectorAll('.played-card--latest'),
        ).toHaveLength(0)
    })
})
