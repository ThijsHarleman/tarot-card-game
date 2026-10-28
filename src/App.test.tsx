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

        expect(
            within(opponentHand).getAllByRole('button', {
                name: /^play /i,
            }),
        ).toHaveLength(5)

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

        const playArea = screen.getByRole('group', {
            name: 'Cards played this round',
        })

        expect(playArea.querySelectorAll('.played-card')).toHaveLength(1)

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

        const playArea = screen.getByRole('group', {
            name: 'Cards played this round',
        })

        expect(playArea.querySelectorAll('.played-card')).toHaveLength(1)

        // The opponent passes, ending the round.
        await user.click(
            screen.getByRole('button', { name: /pass turn/i }),
        )

        // Played cards are cleared from the play area.
        expect(playArea.querySelectorAll('.played-card')).toHaveLength(0)

        // The played card goes into the passing opponent's discard pile.
        const opponentDiscardPile = within(opponentArea).getByRole('group', {
            name: "Opponent's discard pile",
        })

        expect(
            within(opponentDiscardPile).getByText('1'),
        ).toBeInTheDocument()

        // Both players refill their hands for the next round.
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

        // Scores should not be displayed during normal play.
        expect(
            screen.queryByRole('heading', { name: 'Final scores' }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', { name: 'Game over' }),
        ).not.toBeInTheDocument()

        // Each round must contain at least one legal bid before passing.
        for (let round = 0; round < 22; round += 1) {
            const activeHeading = screen.getByRole('heading', {
                name: /— Your turn$/,
            })

            const activePlayerName = activeHeading.textContent?.replace(
                ' — Your turn',
                '',
            )

            if (!activePlayerName) {
                throw new Error('Could not determine the active player.')
            }

            const activePlayerArea = screen.getByRole('region', {
                name: activePlayerName,
            })

            const hand = within(activePlayerArea).getByRole('group', {
                name: `${activePlayerName}'s hand`,
            })

            const handCards = within(hand).queryAllByRole('button', {
                name: /^play /i,
            })

            if (handCards.length > 0) {
                await user.click(handCards[0])
            } else {
                const courtReserve = within(activePlayerArea).getByRole(
                    'group',
                    { name: `${activePlayerName}'s court cards` },
                )

                const courtCards = within(courtReserve).queryAllByRole(
                    'button',
                    { name: /^play /i },
                )

                expect(courtCards.length).toBeGreaterThan(0)
                await user.click(courtCards[0])
            }

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

        // All Major Arcana values (0 through 21) total 231 points.
        expect(playerScore + opponentScore).toBe(231)

        const opponentArea = screen.getByRole('region', {
            name: 'Opponent',
        })
        const playerArea = screen.getByRole('region', {
            name: 'You',
        })

        const opponentMajorArcana = within(opponentArea).getByRole('group', {
            name: "Opponent's Major Arcana",
        })

        const playerMajorArcana = within(playerArea).getByRole('group', {
            name: "You's Major Arcana",
        })

        const displayedMajorArcanaCount =
            opponentMajorArcana.querySelectorAll(
                '.owned-major-arcana__card',
            ).length +
            playerMajorArcana.querySelectorAll(
                '.owned-major-arcana__card',
            ).length

        // Every Major Arcana must belong to exactly one player at game end.
        expect(displayedMajorArcanaCount).toBe(22)

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

        // Starting a new game should restore the normal game screen.
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
