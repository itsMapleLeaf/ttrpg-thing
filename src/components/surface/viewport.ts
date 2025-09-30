import { type } from "arktype"
import { clamp } from "es-toolkit"
import { useWindowSize } from "../../common/dom.ts"
import { useDrag } from "../../common/drag.ts"
import { useLocalStorage } from "../../common/local-storage.ts"
import { type Vec, vec } from "../../common/vec.ts"
import { SURFACE_HEIGHT, SURFACE_WIDTH } from "./constants.ts"

const MAX_ZOOM_TICK = 10
const MIN_ZOOM_TICK = -10
const ZOOM_COEFFICIENT = 1.2

export function useViewport() {
	const [windowWidth, windowHeight] = useWindowSize()

	function clampToWindow(offset: Vec, scale: number): Vec {
		// clamp such that the corners don't go beyond the center of the window
		return vec.clamp(
			offset,
			vec(
				-SURFACE_WIDTH * scale + windowWidth / 2,
				-SURFACE_HEIGHT * scale + windowHeight / 2,
			),
			vec(windowWidth / 2, windowHeight / 2),
		)
	}

	const [viewport, setViewport] = useLocalStorage({
		key: "viewport",
		schema: type({
			offset: { x: "number", y: "number" },
			zoom: "number",
		}),
		fallback: {
			offset: vec.subtract(
				vec(windowWidth / 2, windowHeight / 2),
				vec(SURFACE_WIDTH / 2, SURFACE_HEIGHT / 2),
			),
			zoom: 0,
		},
	})

	const drag = useDrag({
		buttons: ["middle", "right"],
		onEnd(state) {
			setViewport((viewport) => ({
				...viewport,
				offset: clampToWindow(
					vec.add(viewport.offset, state.delta),
					ZOOM_COEFFICIENT ** viewport.zoom,
				),
			}))
		},
	})

	function ref(element: HTMLDivElement | null) {
		if (!element) return

		const controller = new AbortController()

		// use a direct event listener instead of onWheel so we can call preventDefault
		window.addEventListener(
			"wheel",
			(event) => {
				event.preventDefault()

				const delta = -Math.sign(event.deltaY)
				if (delta === 0) return

				setViewport((viewport) => {
					const newZoomTick = clamp(
						viewport.zoom + delta,
						MIN_ZOOM_TICK,
						MAX_ZOOM_TICK,
					)

					// Adjust offset so that the point under the cursor stays in the same place
					const currentScale = ZOOM_COEFFICIENT ** viewport.zoom
					const newScale = ZOOM_COEFFICIENT ** newZoomTick
					const zoomFactor = newScale / currentScale
					const cursorPosition = vec(event.clientX, event.clientY)

					return {
						zoom: newZoomTick,
						offset: clampToWindow(
							vec
								.with(viewport.offset)
								.subtract(cursorPosition)
								.multiply(zoomFactor)
								.add(cursorPosition)
								.result(),
							newScale,
						),
					}
				})
			},
			{ passive: false, signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}

	return {
		scale: ZOOM_COEFFICIENT ** viewport.zoom,
		offset: clampToWindow(viewport.offset, ZOOM_COEFFICIENT ** viewport.zoom),
		drag,
		ref,
	}
}
