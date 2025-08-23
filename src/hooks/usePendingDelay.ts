import { useEffect, useState } from "react"

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
