import { useEffect, useRef, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { HowToPlayModal } from './HowToPlayModal'

function ModalTestHarness() {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const wasOpenRef = useRef(false)

    useEffect(() => {
        if (wasOpenRef.current && !isOpen) {
            triggerRef.current?.focus()
        }

        wasOpenRef.current = isOpen
    }, [isOpen])

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(true)}
            >
                How to play
            </button>

            {isOpen && (
                <HowToPlayModal onClose={() => setIsOpen(false)} />
            )}
        </>
    )
}

describe('HowToPlayModal accessibility', () => {
    it('moves focus into the modal when it opens', async () => {
        const user = userEvent.setup()

        render(<ModalTestHarness />)

        await user.click(
            screen.getByRole('button', { name: 'How to play' })
        )

        expect(
            screen.getByRole('dialog', { name: 'How to play' })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: 'Close instructions' })
        ).toHaveFocus()
    })

    it('closes when Escape is pressed and restores focus', async () => {
        const user = userEvent.setup()

        render(<ModalTestHarness />)

        const trigger = screen.getByRole('button', {
            name: 'How to play',
        })

        await user.click(trigger)

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(trigger).toHaveFocus()
    })

    it('keeps focus inside the modal when tabbing forwards', async () => {
        const user = userEvent.setup()

        render(<ModalTestHarness />)

        await user.click(
            screen.getByRole('button', { name: 'How to play' })
        )

        const closeButton = screen.getByRole('button', {
            name: 'Close instructions',
        })
        const gotItButton = screen.getByRole('button', {
            name: 'Got it!',
        })

        // Focus starts on the close button.
        expect(closeButton).toHaveFocus()

        // Tab through the modal's two buttons.
        await user.tab()
        expect(gotItButton).toHaveFocus()

        // Tab wraps to the first button, not the background trigger.
        await user.tab()
        expect(closeButton).toHaveFocus()
    })

    it('keeps focus inside the modal when tabbing backwards', async () => {
        const user = userEvent.setup()

        render(<ModalTestHarness />)

        await user.click(
            screen.getByRole('button', { name: 'How to play' })
        )

        const closeButton = screen.getByRole('button', {
            name: 'Close instructions',
        })
        const gotItButton = screen.getByRole('button', {
            name: 'Got it!',
        })

        // Shift+Tab from the first button wraps to the last.
        await user.tab({ shift: true })
        expect(gotItButton).toHaveFocus()

        // Another Shift+Tab wraps back to the first.
        await user.tab({ shift: true })
        expect(closeButton).toHaveFocus()
    })

    it('restores focus when the modal is closed with Got it!', async () => {
        const user = userEvent.setup()

        render(<ModalTestHarness />)

        const trigger = screen.getByRole('button', {
            name: 'How to play',
        })

        await user.click(trigger)
        await user.click(screen.getByRole('button', { name: 'Got it!' }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(trigger).toHaveFocus()
    })
})
