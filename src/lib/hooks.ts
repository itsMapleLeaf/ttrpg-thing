import { useCallback, useEffect, useRef } from "react"

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
