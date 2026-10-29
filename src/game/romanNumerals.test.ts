import { describe, expect, it } from 'vitest'
import { toRomanNumeral } from './romanNumerals'

describe('toRomanNumeral', () => {
    it('keeps The Fool as 0', () => {
        expect(toRomanNumeral(0)).toBe('0')
    })

    it('converts standard Major Arcana values', () => {
        expect(toRomanNumeral(1)).toBe('I')
        expect(toRomanNumeral(4)).toBe('IV')
        expect(toRomanNumeral(9)).toBe('IX')
        expect(toRomanNumeral(14)).toBe('XIV')
        expect(toRomanNumeral(21)).toBe('XXI')
    })

    it('rejects invalid values', () => {
        expect(() => toRomanNumeral(-1)).toThrow(RangeError)
        expect(() => toRomanNumeral(1.5)).toThrow(RangeError)
    })
})
