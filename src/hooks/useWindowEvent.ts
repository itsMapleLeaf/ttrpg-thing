import { useEffect } from "react"

export function useWindowEvent<K extends keyof WindowEventMap>(
	eventName: K,
	handler: (event: WindowEventMap[K]) => void,
) {
	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(eventName, handler, {
			signal: controller.signal,
		})

		return () => controller.abort()
	}, [eventName, handler])
}
