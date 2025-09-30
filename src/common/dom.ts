import { useEffect, useState } from "react"

export function useWindowSize(): readonly [number, number] {
	const [width, setWidth] = useState(window.innerWidth)
	const [height, setHeight] = useState(window.innerHeight)

	useWindowEvent("resize", () => {
		setWidth(window.innerWidth)
		setHeight(window.innerHeight)
	})

	return [width, height] as const
}

export function useWindowDragEvents({
	onDragEnter,
	onDragLeave,
	onDragOver,
	onDrop,
}: {
	onDragEnter?: (event: DragEvent) => void
	onDragLeave?: (event: DragEvent) => void
	onDragOver?: (event: DragEvent) => void
	onDrop?: (event: DragEvent) => void
}) {
	useWindowEvent("dragenter", (event) => {
		// ensure the drag is related to the window and not a child element
		if (event.relatedTarget === null) {
			event.preventDefault()
			onDragEnter?.(event)
		}
	})

	useWindowEvent("dragleave", (event) => {
		// ensure the drag is related to the window and not a child element
		if (event.relatedTarget === null) {
			event.preventDefault()
			onDragLeave?.(event)
		}
	})

	useWindowEvent("dragover", (event) => {
		event.preventDefault()
		onDragOver?.(event)
	})

	useWindowEvent("drop", (event) => {
		event.preventDefault()
		onDrop?.(event)
	})
}

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

export function useWindowFileDrop(onDrop?: (event: DragEvent) => void) {
	const [isOver, setIsOver] = useState(false)

	useWindowDragEvents({
		onDragEnter: () => setIsOver(true),
		onDragLeave: () => setIsOver(false),
		onDrop: (event) => {
			setIsOver(false)
			onDrop?.(event)
		},
	})

	return { isOver }
}
