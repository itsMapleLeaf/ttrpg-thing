import { useEffect, useRef, useState } from "react"
import { type Vec, vec } from "../../lib/vec.ts"

type SurfaceState = {
	status: "idle" | "down" | "dragging"
	offset: Vec
	dragStart: Vec
	dragEnd: Vec
}

const surfaceWidth = 1000
const surfaceHeight = 1000

export function SurfaceViewer() {
	return (
		<SurfacePanel>
			<SurfaceCounter />
		</SurfacePanel>
	)
}

function SurfaceCounter() {
	const renders = useRef(0)
	renders.current += 1
	return <div>{renders.current}</div>
}

function SurfacePanel({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<SurfaceState>({
		status: "idle",
		offset: { x: 0, y: 0 },
		dragStart: { x: 0, y: 0 },
		dragEnd: { x: 0, y: 0 },
	})

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"pointermove",
			(event) => {
				if (state.status === "down") {
					event.preventDefault()
					setState((current) => {
						const dragEnd = { x: event.clientX, y: event.clientY }
						const distance = vec.distance(current.dragStart, dragEnd)
						console.log(distance)
						return {
							...current,
							dragEnd,
							status:
								current.status === "down" && distance > 8
									? "dragging"
									: current.status,
						}
					})
				}

				if (state.status === "dragging") {
					event.preventDefault()
					setState((current) => ({
						...current,
						dragEnd: { x: event.clientX, y: event.clientY },
					}))
				}
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
					setState((current) => {
						return {
							...current,
							status: "idle",
							offset: vec.add(
								current.offset,
								vec.subtract(current.dragEnd, current.dragStart),
							),
						}
					})
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
	}, [state.status])

	let renderedOffset = state.offset
	if (state.status === "dragging") {
		renderedOffset = vec.add(
			state.offset,
			vec.subtract(state.dragEnd, state.dragStart),
		)
	}

	return (
		<div
			className="relative h-full overflow-clip bg-gray-950/25"
			onPointerDown={(event) => {
				event.preventDefault()
				setState((current) => ({
					...current,
					status: "down",
					dragStart: { x: event.clientX, y: event.clientY },
					dragEnd: { x: event.clientX, y: event.clientY },
				}))
			}}
		>
			<div
				className="absolute top-0 left-0 origin-top-left panel border-gray-700/50 bg-gray-900"
				style={{
					width: surfaceWidth,
					height: surfaceHeight,
					translate: `${renderedOffset.x}px ${renderedOffset.y}px`,
				}}
			>
				{children}
			</div>
		</div>
	)
}
