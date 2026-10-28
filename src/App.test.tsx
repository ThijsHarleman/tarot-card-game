
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getLegalCards } from './game/game'
import { randomStrategy } from './game/opponent/randomStrategy'

vi.spyOn(randomStrategy, 'chooseAction').mockImplementation((state) => {
    const legalCards = getLegalCards(state)
    const card = legalCards[0]

    if (card === undefined) {
        return { type: 'pass' }
    }

    return { type: 'play', cardId: card.id }
})

beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(randomStrategy.chooseAction).mockImplementation((state) => {
        const card = getLegalCards(state)[0]

        return card === undefined
            ? { type: 'pass' }
            : { type: 'play', cardId: card.id }
    })
})

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
            screen.getByRole('group', { name: 'Cards played this round' }),
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

        // The opponent's cards are not playable by the human.
        expect(
            within(opponentHand).queryAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(0)

        expect(
            screen.queryByRole('button', { name: /draw a card/i }),
        ).not.toBeInTheDocument()
    })

    it('disables passing when no cards have been bid', () => {
        render(<App />)

        expect(
            screen.getByRole('button', { name: /pass turn/i }),
        ).toBeDisabled()
    })

    it('plays a legal card and lets the opponent respond automatically', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        await user.click(
            within(playerHand).getAllByRole('button', {
                name: /^play /i,
            })[0],
        )

        // The opponent automatically plays a legal card.
        await waitFor(() => {
            const playArea = screen.getByRole('group', {
                name: 'Cards played this round',
            })

            expect(
                playArea.querySelectorAll('.played-card'),
            ).toHaveLength(2)
        })

        expect(
            screen.getByRole('heading', {
                name: /you — your turn/i,
            }),
        ).toBeInTheDocument()

        expect(
            within(playerHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(4)

        expect(
            screen.queryByRole('button', { name: /draw a card/i }),
        ).not.toBeInTheDocument()
    })

    it('ends the round when the human passes', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })
        const playerHand = within(playerArea).getByRole('group', {
            name: "You's hand",
        })

        await user.click(
            within(playerHand).getAllByRole('button', {
                name: /^play /i,
            })[0],
        )

        // Wait for the opponent to respond and the turn to return to the human.
        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: /you — your turn/i,
                }),
            ).toBeInTheDocument()
        })

        const playArea = screen.getByRole('group', {
            name: 'Cards played this round',
        })

        expect(playArea.querySelectorAll('.played-card')).toHaveLength(2)

        await user.click(
            screen.getByRole('button', { name: /pass turn/i }),
        )

        expect(playArea.querySelectorAll('.played-card')).toHaveLength(0)

        // The human passed, so the human receives the played cards.
        const playerDiscardPile = within(playerArea).getByRole('group', {
            name: "You's discard pile",
        })

        expect(within(playerDiscardPile).getByText('2')).toBeInTheDocument()

        // The passing player starts the next round.
        expect(
            screen.getByRole('heading', {
                name: /you — your turn/i,
            }),
        ).toBeInTheDocument()
    })

    it('starts a new game with full hands and populated court reserves', async () => {
        const user = userEvent.setup()
        render(<App />)

        const playerArea = screen.getByRole('region', { name: 'You' })

        await user.click(
            within(
                within(playerArea).getByRole('group', {
                    name: "You's hand",
                }),
            ).getAllByRole('button', { name: /^play /i })[0],
        )

        await user.click(
            screen.getByRole('button', { name: /new game/i }),
        )

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
            within(playerHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

        expect(
            within(opponentHand).queryAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(0)

        expect(
            within(playerArea)
                .getByRole('group', { name: "You's court cards" })
                .querySelectorAll('button'),
        ).toHaveLength(4)

        expect(
            within(opponentArea)
                .getByRole('group', { name: "Opponent's court cards" })
                .querySelectorAll('button'),
        ).toHaveLength(0)

        expect(screen.getByText(/no bids yet/i)).toBeInTheDocument()

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

    it('shows final scores and owned Major Arcana only after the game ends', async () => {
        const user = userEvent.setup()
        render(<App />)

        expect(
            screen.queryByRole('heading', { name: 'Final scores' }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', { name: 'Game over' }),
        ).not.toBeInTheDocument()

        // The opponent always plays a legal card, so the human can
        // consistently end each round by passing.
        for (let round = 0; round < 22; round += 1) {
            const playerArea = screen.getByRole('region', { name: 'You' })
            const playerHand = within(playerArea).getByRole('group', {
                name: "You's hand",
            })
            const handCards = within(playerHand).queryAllByRole('button', {
                name: /^play /i,
            })

            if (handCards.length > 0) {
                await user.click(handCards[0])
            } else {
                const courtReserve = within(playerArea).getByRole('group', {
                    name: "You's court cards",
                })
                const courtCards = within(courtReserve).queryAllByRole(
                    'button',
                    { name: /^play /i },
                )

                expect(courtCards.length).toBeGreaterThan(0)
                await user.click(courtCards[0])
            }

            await waitFor(() => {
                expect(
                    screen.getByRole('heading', {
                        name: /you — your turn/i,
                    }),
                ).toBeInTheDocument()
            })

            await user.click(
                screen.getByRole('button', { name: /pass turn/i }),
            )
        }

        expect(
            screen.getByRole('heading', { name: 'Game over' }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', { name: 'Final scores' }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(/^(You win!|You lose\.)$/),
        ).toBeInTheDocument()

        const results = screen.getByRole('region', {
            name: 'Game results',
        })

        const playerScore = Number(
            within(results)
                .getByText('You', { selector: 'span' })
                .parentElement?.querySelector('strong')?.textContent,
        )

        const opponentScore = Number(
            within(results)
                .getByText('Opponent', { selector: 'span' })
                .parentElement?.querySelector('strong')?.textContent,
        )

        // Major Arcana values 0 through 21 total 231 points.
        expect(playerScore + opponentScore).toBe(231)

        const playerArea = screen.getByRole('region', {
            name: 'You',
        })

        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })

        const playerMajorArcana = within(playerArea).getByRole('group', {
            name: "You's Major Arcana",
        })
        const opponentMajorArcana = within(opponentArea).getByRole('group', {
            name: "Opponent's Major Arcana",
        })

        expect(
            playerMajorArcana.querySelectorAll('.owned-major-arcana__card')
                .length +
                opponentMajorArcana.querySelectorAll(
                    '.owned-major-arcana__card',
                ).length,
        ).toBe(22)

        expect(
            within(opponentArea).queryByRole('group', {
                name: "Opponent's hand",
            }),
        ).not.toBeInTheDocument()

        expect(
            within(opponentArea).queryByRole('group', {
                name: "Opponent's draw deck",
            }),
        ).not.toBeInTheDocument()

        expect(
            within(opponentArea).queryByRole('group', {
                name: "Opponent's discard pile",
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: /pass turn/i }),
        ).not.toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /new game/i }),
        )

        expect(
            screen.queryByRole('heading', { name: 'Game over' }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /pass turn/i }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', { name: 'Final scores' }),
        ).not.toBeInTheDocument()
    })
})
