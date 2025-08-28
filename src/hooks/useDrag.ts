import { useEffect, useState } from "react"
import { type Vec, vec } from "../lib/vec.ts"
import { useEffectEvent } from "./useEffectEvent.ts"

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

const buttonValues = {
	left: 0,
	middle: 1,
	right: 2,
}

const buttonMaskValues = {
	left: 1,
	middle: 2,
	right: 4,
}

export function useDrag(args: {
	buttons: ("left" | "right" | "middle")[]
	onStart?: (state: DerivedDragState) => void
	onMove?: (state: DerivedDragState) => void
	onEnd?: (state: DerivedDragState) => void
}) {
	const [state, setState] = useState<DragState>({
		status: "idle",
		start: { x: 0, y: 0 },
		end: { x: 0, y: 0 },
	})

	const handlePointerMove = useEffectEvent((event: PointerEvent) => {
		event.preventDefault()

		const end = { x: event.clientX, y: event.clientY }
		const distance = vec.distance(state.start, end)

		const newState = {
			...state,
			end,
			status:
				state.status === "down" && distance > 8 ? "dragging" : state.status,
		}

		setState(newState)

		if (state.status === "down" && newState.status === "dragging") {
			args?.onStart?.(getDerivedDragState(newState))
		}

		if (newState.status === "dragging") {
			args?.onMove?.(getDerivedDragState(newState))
		}
	})

	const handlePointerUp = useEffectEvent(() => {
		if (state.status === "dragging") {
			window.addEventListener(
				"contextmenu",
				(event) => event.preventDefault(),
				{ once: true },
			)
			args?.onEnd?.(getDerivedDragState(state))
		}

		setState((current) => ({
			...current,
			status: "idle",
		}))
	})

	useEffect(() => {
		if (state.status === "idle") return

		const controller = new AbortController()

		window.addEventListener("pointermove", handlePointerMove, {
			signal: controller.signal,
		})

		window.addEventListener("pointerup", handlePointerUp, {
			signal: controller.signal,
		})

		return () => controller.abort()
	}, [state.status, handlePointerMove, handlePointerUp])

	return {
		state: getDerivedDragState(state),
		getHandleProps: (overrides?: {
			onPointerDown?: (event: React.PointerEvent) => void
		}) => ({
			onPointerDown: (event: React.PointerEvent) => {
				const shouldHandle = args.buttons.some(
					(name) => event.button === buttonValues[name],
				)
				if (!shouldHandle) {
					return
				}

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
