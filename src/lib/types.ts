export type Falsy = false | undefined | null | 0 | 0n | ""

/**
 * An array with at least one element
 */
export type NonEmptyArray<T> = readonly [T, ...T[]]
