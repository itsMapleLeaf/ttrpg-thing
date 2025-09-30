import { useWindowEvent } from "./useWindowEvent.ts"

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
