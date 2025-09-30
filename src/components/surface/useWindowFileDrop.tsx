import { useState } from "react"
import { useWindowDragEvents } from "../../common/dom.ts"
import { Portal } from "../../ui/Portal.tsx"

export function useWindowFileDrop(onDrop: (event: DragEvent) => void) {
	const [isOver, setIsOver] = useState(false)

	useWindowDragEvents({
		onDragEnter: () => setIsOver(true),
		onDragLeave: () => setIsOver(false),
		onDrop: (event) => {
			setIsOver(false)
			onDrop(event)
		},
	})

	return {
		isOver,
		overlayElement: (
			<Portal>
				<div
					className="invisible fixed inset-0 flex-center bg-black/50 opacity-0 backdrop-blur transition-all transition-discrete data-[visible=true]:visible data-[visible=true]:opacity-100"
					data-visible={isOver}
				>
					<p className="text-3xl font-light">Drop files to import assets</p>
					<div
						onDragOver={(event) => event.preventDefault()}
						onDrop={(event) => {
							event.preventDefault()
							console.log("drop a")
						}}
					>
						drop on a
					</div>
					<div
						onDragOver={(event) => event.preventDefault()}
						onDrop={(event) => {
							console.log("drop b")
							event.preventDefault()
						}}
					>
						drop on b
					</div>
				</div>
			</Portal>
		),
	}
}
