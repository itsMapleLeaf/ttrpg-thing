import { useEffect, useState } from "react"
import { type Vec, vec } from "../lib/vec.ts"
import { useLatestRef } from "./useLatestRef.ts"

export type DragState = {
	status: "idle" | "down" | "dragging"
	start: Vec
	end: Vec
}

export type DerivedDragState = DragState & {
	delta: Vec
}

const getDerivedDragState = (state: DragState): DerivedDragState => ({
	...state,
	delta:
		state.status === "dragging" ? vec.subtract(state.end, state.start) : vec(0),
})

export function useDrag({
	onDragEnd,
}: {
	onDragEnd: (state: DerivedDragState) => void
}) {
	const [state, setState] = useState<DragState>({
		status: "idle",
		start: { x: 0, y: 0 },
		end: { x: 0, y: 0 },
	})

	const stateRef = useLatestRef(state)
	const onDragEndRef = useLatestRef(onDragEnd)

	useEffect(() => {
		if (state.status === "idle") return

		const controller = new AbortController()

		window.addEventListener(
			"pointermove",
			(event) => {
				event.preventDefault()
				setState((current) => {
					const end = { x: event.clientX, y: event.clientY }
					const distance = vec.distance(current.start, end)
					const status =
						current.status === "down" && distance > 8
							? "dragging"
							: current.status
					return { ...current, end, status }
				})
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"pointerup",
			() => {
				if (state.status === "down") {
					setState((current) => ({
						...current,
						status: "idle",
					}))
				}

				if (state.status === "dragging") {
					setState((current) => ({ ...current, status: "idle" }))

					onDragEndRef.current(getDerivedDragState(stateRef.current))

					window.addEventListener(
						"contextmenu",
						(event) => event.preventDefault(),
						{ once: true },
					)
				}
			},
			{ signal: controller.signal },
		)

		window.addEventListener(
			"pointercancel",
			() => {
				setState((current) => ({
					...current,
					status: "idle",
				}))
			},
			{ signal: controller.signal },
		)

		return () => controller.abort()
	}, [state.status, onDragEndRef, stateRef])

	return {
		state: getDerivedDragState(state),
		getHandleProps: (overrides?: {
			onPointerDown?: (event: React.PointerEvent) => void
		}) => ({
			onPointerDown: (event: React.PointerEvent) => {
				overrides?.onPointerDown?.(event)

				if (event.isDefaultPrevented()) {
					return
				}

				event.preventDefault()
				event.stopPropagation()

				setState((current) => ({
					...current,
					status: "down",
					start: { x: event.clientX, y: event.clientY },
					end: { x: event.clientX, y: event.clientY },
				}))
			},
		}),
	}
}
