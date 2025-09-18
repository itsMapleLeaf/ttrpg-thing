import type { Type } from "arktype"
import { type SetStateAction, useEffect, useState } from "react"

export type UseLocalStorageOptions<T> = {
	key: string
	fallback: T
	schema: Type<T>
}

export function useLocalStorage<T>({
	key,
	fallback,
	schema,
}: UseLocalStorageOptions<T>) {
	const [state, setState] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key)
			if (!item) return fallback

			const parsed = JSON.parse(item)
			return schema.assert(parsed) as T
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error)
			return fallback
		}
	})

	return useLocalStorageEffect({
		key,
		schema,
		state: [state, setState] as const,
	})
}

export type UseLocalStorageWrapperOptions<T> = {
	key: string
	schema: Type<T>
	state: readonly [T, (action: (value: T) => T) => void]
}

export function useLocalStorageEffect<T>({
	key,
	schema,
	state: [state, setState],
}: UseLocalStorageWrapperOptions<T>) {
	const setValue = (action: SetStateAction<T>) => {
		try {
			const value = action instanceof Function ? action(state) : action
			setState(() => value)
			window.localStorage.setItem(key, JSON.stringify(value))
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error)
		}
	}

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"storage",
			(event) => {
				if (event.key === key && event.newValue !== null) {
					try {
						const parsed = JSON.parse(event.newValue)
						const validated = schema.assert(parsed) as T
						setState(() => validated)
					} catch (error) {
						console.warn(
							`Error parsing localStorage key "${key}" from storage event:`,
							error,
						)
					}
				}
			},
			{ signal: controller.signal },
		)

		return () => controller.abort()
	}, [key, schema, setState])

	return [state, setValue] as const
}
