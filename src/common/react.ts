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
				// eslint-disable-next-line react-hooks/immutability
				ref.current = element
			}
		}
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
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setDelayedPending(false)
		}
	}, [pending])
	return delayedPending
}
