import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { sortBy } from "es-toolkit"
import { type ComponentProps, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import type { ClientTile } from "../../../convex/tiles.ts"
import { type DerivedDragState, useDrag } from "../../hooks/useDrag.ts"
import { useLocalStorage } from "../../hooks/useLocalStorage.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { useStable } from "../../hooks/useStable.ts"
import { getOptimizedImageUrl } from "../../lib/helpers.ts"
import { type Vec, vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"

export function SurfaceViewer({ surfaceId }: { surfaceId: Id<"surfaces"> }) {
	const surface = useStable(useQuery(api.surfaces.get, { id: surfaceId }))

	return (
		surface && (
			<SurfacePanel surface={surface}>
				<SurfaceTiles surface={surface} />
			</SurfacePanel>
		)
	)
}

function SurfaceTiles({ surface }: { surface: ClientSurface }) {
	const tiles = useQuery(api.tiles.list, { surfaceId: surface._id }) ?? []
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
	} = useSelection(tiles.map((t) => t._id) ?? [])

	const containerRef = useRef<HTMLDivElement>(null)

	// we only want to calculate this as-needed
	// to avoid too many layout calcs from getBoundingClientRef
	const containerOffsetRef = useRef<Vec>(vec(0))
	function updateContainerOffset() {
		const containerRect = containerRef.current?.getBoundingClientRect()
		containerOffsetRef.current = vec(
			containerRect?.left ?? 0,
			containerRect?.top,
		)
	}

	const [selectionArea, setSelectionArea] = useState<{ start: Vec; end: Vec }>()
	function updateSelectionArea(state: DerivedDragState) {
		const [start, end] = vec.corners(
			vec.subtract(state.start, containerOffsetRef.current),
			vec.subtract(state.end, containerOffsetRef.current),
		)
		setSelectionArea({ start, end })
		return { start, end }
	}

	const tileDrag = useDrag({
		buttons: ["left"],
		onEnd: (state) => {
			const moved = vec.subtract(state.end, state.start)
			const now = Date.now()

			updateTiles({
				updates: orderedTiles
					.filter((tile) => selectedTileIds.has(tile._id))
					.flatMap((tile, index) => {
						const newPosition = vec.roundTo(
							vec.add(vec(tile.left, tile.top), moved),
							20,
						)

						return {
							id: tile._id,
							patch: {
								left: newPosition.x,
								top: newPosition.y,
								lastMovedAt: now,
								order: index,
							},
						}
					}),
			}).catch((error) => {
				toast.error(String(error))
			})
		},
	})

	const orderedTiles = sortBy(tiles, [
		// put bigger tiles at the back
		(it) => -Math.max(it.width, it.height),

		// make dragged tiles appear at front,
		// to reflect where they'll get placed while they're being dragged
		(it) =>
			isSelected(it._id) && tileDrag.state.status === "dragging" ? 1 : 0,

		// sort by last moved, so newly moved tiles get placed on top
		(it) => it.lastMovedAt ?? 0,

		// manual order, which is set to
		// preserve the order of several tiles moved at once,
		// which would otherwise be clobbered when their `lastMovedAt`
		// gets set to the value value
		(it) => it.order ?? 0,
	])

	// map to indexes for later efficient use as z-indexes
	// we use z-indexes instead of mapping over a sorted array
	// because CSS transitions break when an item is re-ordered
	// (even though it theoretically shouldn't with keys?? lol)
	const tileOrder = new Map(
		orderedTiles.map((tile, index) => [tile._id, index]),
	)

	const backgroundDrag = useDrag({
		buttons: ["left"],
		onStart: (state) => {
			updateContainerOffset()
			updateSelectionArea(state)
		},
		onMove: (state) => {
			const area = updateSelectionArea(state)

			const overlappingTiles = tiles.filter((tile) => {
				const tileTopLeft = vec(tile.left, tile.top)

				const tileBottomRight = vec.add(
					tileTopLeft,
					vec(tile.width, tile.height),
				)

				return vec.intersects(
					area.start,
					area.end,
					tileTopLeft,
					tileBottomRight,
				)
			})

			setSelection(overlappingTiles.map((it) => it._id))
		},
		onEnd: () => {
			setSelectionArea(undefined)
		},
	})

	return (
		<div
			className="relative size-full touch-none"
			ref={containerRef}
			{...backgroundDrag.getHandleProps({
				onPointerDown: (event) => {
					if (!event.ctrlKey && !event.shiftKey) {
						clearSelection()
					}
				},
			})}
		>
			<div className="isolate">
				{tiles.map((tile) => {
					const selected = isSelected(tile._id)
					return (
						<SurfaceTileCard
							key={tile._id}
							tile={tile}
							position={vec.add(
								vec(tile.left, tile.top),
								selected ? tileDrag.state.delta : vec(0),
							)}
							selected={selected}
							dragging={selected && tileDrag.state.status === "dragging"}
							order={tileOrder.get(tile._id)}
							{...tileDrag.getHandleProps({
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
						/>
					)
				})}
			</div>

			{selectionArea && (
				<div
					className="pointer-events-none absolute top-0 left-0 border border-primary-700 bg-primary-800/25"
					style={{
						translate: `${selectionArea.start.x}px ${selectionArea.start.y}px`,
						width: selectionArea.end.x - selectionArea.start.x,
						height: selectionArea.end.y - selectionArea.start.y,
					}}
				></div>
			)}
		</div>
	)
}

function SurfaceTileCard({
	tile,
	position,
	selected,
	dragging,
	order,
	...props
}: {
	tile: ClientTile
	position: Vec
	selected: boolean
	dragging: boolean
	order: number | undefined
} & ComponentProps<"div">) {
	return (
		<div
			{...props}
			className={twMerge(
				"absolute touch-none panel transition ease-out data-selected:border-primary-400",
				dragging ? "opacity-75 transition-opacity" : "",
			)}
			data-selected={selected || undefined}
			style={{
				translate: `${Math.round(position.x)}px ${Math.round(position.y)}px`,
				width: tile.width,
				height: tile.height,
				backgroundImage:
					tile.assetUrl == null
						? undefined
						: `url(${getOptimizedImageUrl(tile.assetUrl, ceilToNearest(tile.width, 100))})`,
				backgroundPosition: "center top",
				backgroundSize: "cover",
				zIndex: order,
			}}
		>
			<div
				className="relative size-full bg-primary-900/25 opacity-0 transition data-visible:opacity-100"
				data-visible={selected || undefined}
			></div>
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
	surface,
	children,
}: {
	surface: ClientSurface
	children: React.ReactNode
}) {
	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const createTile = useMutation(api.tiles.create)
	const toast = useToastContext()

	const [viewportOffset, setViewportOffset] = useLocalStorage({
		key: "SurfaceViewer:viewportOffset",
		fallback: vec(50),
		schema: type({ x: "number", y: "number" }),
	})

	const drag = useDrag({
		buttons: ["middle", "right"],
		onEnd: (state) => {
			setViewportOffset((current) =>
				vec.add(current, vec.subtract(state.end, state.start)),
			)
		},
	})

	let renderedOffset = viewportOffset
	if (drag.state.status === "dragging") {
		renderedOffset = vec.add(
			viewportOffset,
			vec.subtract(drag.state.end, drag.state.start),
		)
	}
	renderedOffset = vec.roundTo(renderedOffset, 1)

	return (
		<div
			className="relative h-full touch-none overflow-clip bg-gray-950/25"
			{...drag.getHandleProps()}
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
						left: event.clientX - rect.left - viewportOffset.x - 50,
						top: event.clientY - rect.top - viewportOffset.y - 50,
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
				className="pointer-events-children absolute top-0 left-0 origin-top-left panel overflow-visible border-gray-700/50 bg-gray-900"
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
