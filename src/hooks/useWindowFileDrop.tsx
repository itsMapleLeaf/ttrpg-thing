import { useEffect, useState } from "react"
import { Portal } from "../ui/Portal.tsx"
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

	return { isOver, overlayElement: <FileDropOverlay isOver={isOver} /> }
}

function FileDropOverlay({ isOver }: { isOver: boolean }) {
	return (
		<Portal>
			<div
				className="pointer-events-none invisible fixed inset-0 flex-center bg-black/50 opacity-0 backdrop-blur transition-all transition-discrete data-[visible=true]:visible data-[visible=true]:opacity-100"
				data-visible={isOver}
			>
				<p className="text-3xl font-light">Drop files to import assets</p>
			</div>
		</Portal>
	)
}
