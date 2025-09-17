/**
 * Represents falsy values, useful for type narrowing
 */
export type Falsy = false | undefined | null | 0 | 0n | ""

/**
 * Creates a branded type, to prevent accidental mixing of same-type values from incorrect sources
 *
 * @example
 * type UserId = Branded<string, 'UserId'>
 *
 * type User = { id: UserId, name: string }
 *
 * function findUser(id: UserId): User | undefined {
 *  return users.find(user => user.id === id)
 * }
 *
 * const userId = getUserIdFromSomewhere() // UserId
 * const someRandomStringAccidentallyUsedAsAUserId = getSomeRandomString() // string
 *
 * const user = findUser(userId) // OK
 * const user2 = findUser(someRandomStringAccidentallyUsedAsAUserId) // Error
 */
export type Branded<T, Brand> = T & { __brand: Brand }

/**
 * An array with at least one element
 */
export type NonEmptyArray<T> = readonly [T, ...T[]]
