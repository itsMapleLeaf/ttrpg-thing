import { type RefObject, useCallback, useEffect, useRef, useState } from "react"

export function useMergedRef<T>(
	...refs: (React.Ref<T> | null | undefined)[]
): React.RefCallback<T> {
	const refsRef = useRef(refs) // lol
	useEffect(() => {
		refsRef.current = refs
	})
	return useCallback((element: T) => {
		for (const ref of refsRef.current) {
			if (typeof ref === "function") {
				ref(element)
			} else if (ref && typeof ref === "object") {
				ref.current = element
			}
		}
	}, [])
}

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

export function useLatestRef<T>(state: T): RefObject<T> {
	const stateRef = useRef(state)
	useEffect(() => {
		stateRef.current = state
	})
	return stateRef
}

export function usePendingDelay(pending: boolean | undefined) {
	const [delayedPending, setDelayedPending] = useState(pending)
	useEffect(() => {
		if (pending) {
			const timeout = setTimeout(() => {
				setDelayedPending(true)
			}, 300)
			return () => clearTimeout(timeout)
		} else {
			setDelayedPending(false)
		}
	}, [pending])
	return delayedPending
}
