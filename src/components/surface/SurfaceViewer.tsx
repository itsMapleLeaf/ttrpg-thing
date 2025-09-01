import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { sortBy } from "es-toolkit"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { type DerivedDragState, useDrag } from "../../hooks/useDrag.ts"
import { useLocalStorage } from "../../hooks/useLocalStorage.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { type Vec, vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"
import { SurfaceTile } from "./SurfaceTile.tsx"

const surfaceWidth = 1000
const surfaceHeight = 1000

export const SurfaceAssetDropData = type({
	assetId: type.string.as<Id<"assets">>(),
})

export function SurfaceViewer({ surface }: { surface: ClientSurface }) {
	const toast = useToastContext()

	const tiles = useQuery(api.tiles.list, { surfaceId: surface._id }) ?? []
	const createTile = useMutation(api.tiles.create)
	const tileSelection = useSelection(tiles.map((t) => t._id) ?? [])

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

	const [viewportOffset, setViewportOffset] = useLocalStorage({
		key: "SurfaceViewer:viewportOffset",
		fallback: vec(50),
		schema: type({ x: "number", y: "number" }),
	})

	const viewportDrag = useDrag({
		buttons: ["middle", "right"],
		onEnd: (state) => {
			setViewportOffset((current) =>
				vec.add(current, vec.subtract(state.end, state.start)),
			)
		},
	})

	let renderedOffset = viewportOffset
	if (viewportDrag.state.status === "dragging") {
		renderedOffset = vec.add(
			viewportOffset,
			vec.subtract(viewportDrag.state.end, viewportDrag.state.start),
		)
	}
	renderedOffset = vec.roundTo(renderedOffset, 1)

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

	const areaSelectDrag = useDrag({
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

			tileSelection.setSelectedItems(overlappingTiles.map((it) => it._id))
		},
	})

	const tileDrag = useDrag({
		buttons: ["left"],
		onEnd: (state) => {
			const moved = vec.subtract(state.end, state.start)
			const now = Date.now()

			updateTiles({
				updates: orderedTiles
					.filter((tile) => tileSelection.items.has(tile._id))
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
			tileSelection.has(it._id) && tileDrag.state.status === "dragging" ? 1 : 0,

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

	return (
		<div
			className="relative h-full touch-none overflow-clip bg-gray-950/25"
			onPointerDown={viewportDrag.handlePointerDown}
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
						type: "image",
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
				className="relative h-full touch-none"
				onPointerDown={(event) => {
					if (event.button === 0 && !event.ctrlKey && !event.shiftKey) {
						tileSelection.clear()
					}
					areaSelectDrag.handlePointerDown(event)
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
					<div
						className="relative isolate size-full touch-none"
						ref={containerRef}
					>
						{tiles.map((tile) => {
							const selected = tileSelection.has(tile._id)

							const position = vec.add(
								vec(tile.left, tile.top),
								selected ? tileDrag.state.delta : vec(0),
							)

							return (
								<div
									key={tile._id}
									style={{
										zIndex: tileOrder.get(tile._id),
										translate: `${Math.round(position.x)}px ${Math.round(position.y)}px`,
									}}
									className={twMerge(
										"absolute touch-none transition ease-out",
										selected && tileDrag.state.isDragging
											? "opacity-75 duration-50"
											: "",
									)}
									onPointerDown={(event) => {
										tileDrag.handlePointerDown(event)

										if (event.ctrlKey || event.shiftKey) {
											tileSelection.toggleItemSelected(tile._id)
											return
										}

										if (!selected) {
											tileSelection.setSelectedItems([tile._id])
										}
									}}
								>
									<SurfaceTile tile={tile} selected={selected} />
								</div>
							)
						})}
					</div>

					{selectionArea && areaSelectDrag.state.isDragging && (
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
			</div>
		</div>
	)
}
