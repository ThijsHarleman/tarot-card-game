
export function toRomanNumeral(value: number): string {
    if (value === 0) {
        return '0'
    }

    if (!Number.isInteger(value) || value < 0 || value > 39) {
        throw new RangeError('Value must be an integer between 0 and 39.')
    }

    const numerals: [number, string][] = [
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
    ]

    let remaining = value
    let result = ''

    for (const [amount, numeral] of numerals) {
        while (remaining >= amount) {
            result += numeral
            remaining -= amount
        }
    }

    return result
}
