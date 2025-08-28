import { useCallback, useEffect, useRef } from "react"

/**
 * @see https://react.dev/learn/separating-events-from-effects#declaring-an-effect-event
 */
export function useEffectEvent<Args extends unknown[], Return>(
	callback: (...args: Args) => Return,
): (...args: Args) => Return {
	const ref = useRef((..._args: Args): Return => {
		throw new Error("Attempted to call effect event during render")
	})
	useEffect(() => {
		ref.current = callback
	})
	return useCallback((...args: Args): Return => {
		return ref.current(...args)
	}, [])
}
