import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import type { ClientTile } from "../../../convex/tiles.ts"
import { getOptimizedImageUrl } from "../../lib/helpers.ts"
import { type Vec, vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"

export function SurfaceViewer({ surfaceId }: { surfaceId: Id<"surfaces"> }) {
	const surface = useQuery(api.surfaces.get, { id: surfaceId })
	return (
		surface && (
			<SurfacePanel surface={surface}>
				<SurfaceTiles surface={surface} />
			</SurfacePanel>
		)
	)
}

function SurfaceTiles({ surface }: { surface: ClientSurface }) {
	const tiles = useQuery(api.tiles.list, { surfaceId: surface._id })
	return (
		<div className="relative size-full">
			{tiles?.map((tile) => (
				<SurfaceTile key={tile._id} tile={tile} />
			))}
		</div>
	)
}

function SurfaceTile({ tile }: { tile: ClientTile }) {
	return (
		<div
			key={tile._id}
			className="absolute panel"
			style={{
				translate: `${tile.left}px ${tile.top}px`,
				width: tile.width,
				height: tile.height,
				backgroundImage:
					tile.assetUrl == null
						? undefined
						: `url(${getOptimizedImageUrl(tile.assetUrl, ceilToNearest(tile.width, 100))})`,
				backgroundPosition: "center",
				backgroundSize: "cover",
			}}
		></div>
	)
}

function ceilToNearest(input: number, multiple: number) {
	return Math.ceil(input / multiple) * multiple
}

export const SurfaceAssetDropData = type({
	assetId: type.string.as<Id<"assets">>(),
})

function SurfacePanel({
	children,
	surface,
}: {
	children: React.ReactNode
	surface: ClientSurface
}) {
	type SurfaceState = {
		status: "idle" | "down" | "dragging"
		offset: Vec
		dragStart: Vec
		dragEnd: Vec
	}

	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const toast = useToastContext()
	const createTile = useMutation(api.tiles.create)

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
			className="relative h-full touch-none overflow-clip bg-gray-950/25"
			onPointerDown={(event) => {
				event.preventDefault()
				setState((current) => ({
					...current,
					status: "down",
					dragStart: { x: event.clientX, y: event.clientY },
					dragEnd: { x: event.clientX, y: event.clientY },
				}))
			}}
			onDragEnter={(event) => {
				event.preventDefault()
				event.dataTransfer.dropEffect = "copy"
			}}
			onDragOver={(event) => {
				event.preventDefault()
			}}
			onDrop={async (event) => {
				try {
					const DropDataFromJson =
						type("string.json.parse").to(SurfaceAssetDropData)

					const data = DropDataFromJson.assert(
						event.dataTransfer.getData("application/json"),
					)

					const rect = event.currentTarget.getBoundingClientRect()

					await createTile({
						surfaceId: surface._id,
						left: event.clientX - rect.left - state.offset.x - 50,
						top: event.clientY - rect.top - state.offset.y - 50,
						width: 100,
						height: 100,
						assetId: data.assetId,
					})
				} catch (error) {
					toast.error(String(error))
				}
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
