import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { type RefObject, useEffect, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useSelection } from "../../hooks/useSelection.ts"
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
	const toast = useToastContext()

	const updateTiles = useMutation(api.tiles.updateMany).withOptimisticUpdate(
		(store, args) => {
			const patchesById = new Map(args.updates.map((it) => [it.id, it.patch]))
			for (const query of store.getAllQueries(api.tiles.list)) {
				store.setQuery(
					api.tiles.list,
					query.args,
					query.value?.map((doc) => ({
						...doc,
						...patchesById.get(doc._id),
					})),
				)
			}
		},
	)

	const {
		selection: selectedTileIds,
		isSelected,
		setSelection,
		clearSelection,
		...selection
	} = useSelection(tiles?.map((t) => t._id) ?? [])

	const drag = useDrag({
		onDragEnd(state) {
			const tilesById = new Map(tiles?.map((it) => [it._id, it]))
			const moved = vec.subtract(state.dragEnd, state.dragStart)

			updateTiles({
				updates: [...selectedTileIds].flatMap((id) => {
					const tile = tilesById.get(id)
					if (!tile) return []

					const newPosition = vec.add(vec(tile.left, tile.top), moved)

					return {
						id,
						patch: {
							left: newPosition.x,
							top: newPosition.y,
						},
					}
				}),
			}).catch((error) => {
				toast.error(String(error))
			})
		},
	})

	const selectedTileDragOffset =
		drag.state.status === "dragging"
			? vec.subtract(drag.state.dragEnd, drag.state.dragStart)
			: vec(0)

	return (
		<div
			className="relative size-full"
			onPointerDown={(event) => {
				if (event.button === 0 && !event.ctrlKey && !event.shiftKey) {
					clearSelection()
				}
			}}
		>
			{tiles?.map((tile) => {
				const selected = isSelected(tile._id)

				const position = vec.add(
					vec(tile.left, tile.top),
					selected ? selectedTileDragOffset : vec(0),
				)

				return (
					<div
						key={tile._id}
						className="absolute panel data-selected:border-primary-400"
						data-selected={selected || undefined}
						style={{
							translate: `${position.x}px ${position.y}px`,
							width: tile.width,
							height: tile.height,
							backgroundImage:
								tile.assetUrl == null
									? undefined
									: `url(${getOptimizedImageUrl(tile.assetUrl, ceilToNearest(tile.width, 100))})`,
							backgroundPosition: "center",
							backgroundSize: "cover",
						}}
						{...drag.handleProps({
							onPointerDown: (event) => {
								if (event.ctrlKey || event.shiftKey) {
									selection.toggleSelected(tile._id)
									return
								}

								if (!selected) {
									setSelection([tile._id])
								}
							},
						})}
					></div>
				)
			})}
		</div>
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
		offset: Vec
	}

	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const toast = useToastContext()
	const createTile = useMutation(api.tiles.create)

	const [state, setState] = useState<SurfaceState>({
		offset: { x: 0, y: 0 },
	})

	const drag = useDrag({
		onDragEnd(state) {
			setState((current) => ({
				...current,
				offset: vec.add(
					current.offset,
					vec.subtract(state.dragEnd, state.dragStart),
				),
			}))
		},
	})

	let renderedOffset = state.offset
	if (drag.state.status === "dragging") {
		renderedOffset = vec.add(
			state.offset,
			vec.subtract(drag.state.dragEnd, drag.state.dragStart),
		)
	}

	return (
		<div
			className="relative h-full touch-none overflow-clip bg-gray-950/25"
			{...drag.handleProps()}
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

type DragState = {
	status: "idle" | "down" | "dragging"
	dragStart: Vec
	dragEnd: Vec
}

function useDrag({ onDragEnd }: { onDragEnd: (state: DragState) => void }) {
	const [state, setState] = useState<DragState>({
		status: "idle",
		dragStart: { x: 0, y: 0 },
		dragEnd: { x: 0, y: 0 },
	})

	const stateRef = useLatestRef(state)
	const onDragEndRef = useLatestRef(onDragEnd)

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
					setState((current) => ({ ...current, status: "idle" }))

					onDragEndRef.current(stateRef.current)

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
		state,
		handleProps: (overrides?: {
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
					dragStart: { x: event.clientX, y: event.clientY },
					dragEnd: { x: event.clientX, y: event.clientY },
				}))
			},
		}),
	}
}

function useLatestRef<T>(state: T): RefObject<T> {
	const stateRef = useRef(state)
	useEffect(() => {
		stateRef.current = state
	})
	return stateRef
}
