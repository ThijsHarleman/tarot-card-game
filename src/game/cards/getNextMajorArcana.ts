import type { MajorArcanaCard } from './card'
import { MAJOR_ARCANA } from './card'

export function getNextMajorArcana(
    current: MajorArcanaCard,
): MajorArcanaCard | undefined {
    const nextNumber = current.number + 1
    const name = MAJOR_ARCANA[nextNumber]

    if (name === undefined) {
        return undefined
    }

    return {
        kind: 'major',
        id: `major-${nextNumber}`,
        name,
        number: nextNumber,
    }
}
