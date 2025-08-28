import { type RefObject, useEffect, useRef } from "react"

export function useLatestRef<T>(state: T): RefObject<T> {
	const stateRef = useRef(state)
	useEffect(() => {
		stateRef.current = state
	})
	return stateRef
}
