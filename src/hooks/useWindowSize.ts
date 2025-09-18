import { useEffect, useState } from "react"

export function useWindowSize(): readonly [number, number] {
	const [width, setWidth] = useState(window.innerWidth)
	const [height, setHeight] = useState(window.innerHeight)

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"resize",
			() => {
				setWidth(window.innerWidth)
				setHeight(window.innerHeight)
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}, [])

	return [width, height] as const
}
