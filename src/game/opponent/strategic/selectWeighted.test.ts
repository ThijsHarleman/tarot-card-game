import { describe, expect, it } from 'vitest'
import { selectWeighted } from './selectWeighted'

describe('selectWeighted', () => {
    const options = [
        { value: 'A', weight: 0.7 },
        { value: 'B', weight: 0.2 },
        { value: 'C', weight: 0.1 },
    ]

    it('selects the first option when the random value is near zero', () => {
        expect(selectWeighted(options, () => 0)).toBe('A')
    })

    it('selects the second option when the random value falls in its range', () => {
        expect(selectWeighted(options, () => 0.75)).toBe('B')
    })

    it('selects the third option when the random value falls in its range', () => {
        expect(selectWeighted(options, () => 0.95)).toBe('C')
    })

    it('rejects an empty collection', () => {
        expect(() => selectWeighted([])).toThrow()
    })

    it('rejects a collection with zero total weight', () => {
        expect(() =>
            selectWeighted([
                { value: 'A', weight: 0 },
                { value: 'B', weight: 0 },
            ]),
        ).toThrow()
    })
})
