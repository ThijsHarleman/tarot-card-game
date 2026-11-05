import { describe, expect, it } from 'vitest'
import {
    chooseParent,
    selectParents,
} from './selectParents'

const strategies = [
    { name: 'strategy_1' },
    { name: 'strategy_2' },
    { name: 'strategy_3' },
    { name: 'strategy_4' },
    { name: 'strategy_5' },
]

const rankings = [
    { name: 'strategy_3', rank: 3 },
    { name: 'strategy_1', rank: 1 },
    { name: 'strategy_5', rank: 5 },
    { name: 'strategy_2', rank: 2 },
    { name: 'strategy_4', rank: 4 },
]

describe('selectParents', () => {
    it('returns elites in ranking order', () => {
        const result = selectParents(strategies, rankings, 2, 4)

        expect(result.elites.map(({ name }) => name)).toEqual([
            'strategy_1',
            'strategy_2',
        ])
    })

    it('returns the requested number of strategies in the parent pool', () => {
        const result = selectParents(strategies, rankings, 2, 3)

        expect(result.parentPool.map(({ name }) => name)).toEqual([
            'strategy_1',
            'strategy_2',
            'strategy_3',
        ])
    })

    it('includes all elites in the parent pool', () => {
        const result = selectParents(strategies, rankings, 2, 4)

        for (const elite of result.elites) {
            expect(result.parentPool).toContain(elite)
        }
    })

    it('returns the original strategy objects', () => {
        const result = selectParents(strategies, rankings, 2, 3)

        expect(result.elites[0]).toBe(strategies[0])
        expect(result.parentPool[1]).toBe(strategies[1])
    })

    it('allows zero elites', () => {
        const result = selectParents(strategies, rankings, 0, 3)

        expect(result.elites).toEqual([])
        expect(result.parentPool).toHaveLength(3)
    })

    it('rejects an invalid elite count', () => {
        expect(() => selectParents(strategies, rankings, -1, 3)).toThrow(RangeError)
        expect(() => selectParents(strategies, rankings, 1.5, 3)).toThrow(RangeError)
    })

    it('rejects an invalid parent pool size', () => {
        expect(() => selectParents(strategies, rankings, 1, 0)).toThrow(RangeError)
        expect(() => selectParents(strategies, rankings, 1, 2.5)).toThrow(RangeError)
        expect(() => selectParents(strategies, rankings, 1, 6)).toThrow(RangeError)
    })

    it('rejects an elite count larger than the parent pool', () => {
        expect(() => selectParents(strategies, rankings, 3, 2)).toThrow(RangeError)
    })

    it('rejects duplicate strategy names', () => {
        const duplicates = [
            { name: 'strategy_1' },
            { name: 'strategy_1' },
        ]

        expect(() =>
            selectParents(duplicates, [
                { name: 'strategy_1', rank: 1 },
                { name: 'strategy_1', rank: 2 },
            ], 1, 2),
        ).toThrow('Strategy names must be unique.')
    })

    it('rejects incomplete rankings', () => {
        expect(() =>
            selectParents(strategies, rankings.slice(1), 1, 3),
        ).toThrow('There must be one ranking for every strategy.')
    })

    it('rejects rankings that refer to an unknown strategy', () => {
        const invalidRankings = [
            ...rankings.slice(0, -1),
            { name: 'unknown_strategy', rank: 5 },
        ]

        expect(() =>
            selectParents(strategies, invalidRankings, 1, 3),
        ).toThrow('No strategy found for ranking: unknown_strategy')
    })

    it('rejects duplicate ranking entries', () => {
        const duplicateRankings = [
            ...rankings.slice(0, -1),
            { name: 'strategy_1', rank: 5 },
        ]

        expect(() =>
            selectParents(strategies, duplicateRankings, 1, 3),
        ).toThrow('Each strategy must appear exactly once in the rankings.')
    })
})

describe('chooseParent', () => {
    const parentPool = [
        { name: 'best' },
        { name: 'second' },
        { name: 'third' },
    ]

    it('selects the highest-ranked parent at the start of the random range', () => {
        expect(chooseParent(parentPool, () => 0)).toBe(parentPool[0])
    })

    it('uses decreasing weights for lower-ranked parents', () => {
        // Weights are 3, 2, 1. The second parent occupies [3/6, 5/6).
        expect(chooseParent(parentPool, () => 0.5)).toBe(parentPool[1])
        expect(chooseParent(parentPool, () => 0.8)).toBe(parentPool[1])
        expect(chooseParent(parentPool, () => 0.84)).toBe(parentPool[2])
    })

    it('can select the last parent near the end of the random range', () => {
        expect(chooseParent(parentPool, () => 0.99)).toBe(parentPool[2])
    })

    it('allows the same parent to be selected repeatedly', () => {
        const first = chooseParent(parentPool, () => 0)
        const second = chooseParent(parentPool, () => 0)

        expect(first).toBe(second)
    })

    it('rejects an empty parent pool', () => {
        expect(() => chooseParent([], () => 0)).toThrow(
            'Cannot choose a parent from an empty pool.',
        )
    })

    it('rejects invalid random values', () => {
        expect(() => chooseParent(parentPool, () => -0.1)).toThrow(RangeError)
        expect(() => chooseParent(parentPool, () => 1)).toThrow(RangeError)
        expect(() => chooseParent(parentPool, () => Number.NaN)).toThrow(RangeError)
    })
})
