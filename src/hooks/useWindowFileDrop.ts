import { useEffect, useState } from "react"
import { useEffectEvent } from "./useEffectEvent.ts"

export function useWindowFileDrop(onDrop: (event: DragEvent) => void) {
	const [isOver, setIsOver] = useState(false)

	const handleDrop = useEffectEvent((event: DragEvent) => {
		event.preventDefault()
		setIsOver(false)
		onDrop?.(event)
	})

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"dragenter",
			(event) => {
				// ensure the drag is related to the window and not a child element
				if (event.relatedTarget === null) {
					event.preventDefault()
					setIsOver(true)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragleave",
			(event) => {
				// ensure the drag is related to the window and not a child element
				if (event.relatedTarget === null) {
					event.preventDefault()
					setIsOver(false)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"dragover",
			(event) => {
				event.preventDefault()
			},
			{ signal: controller.signal },
		)

		window.addEventListener("drop", handleDrop, { signal: controller.signal })

		return () => controller.abort()
	}, [handleDrop])

	return { isOver }
}
