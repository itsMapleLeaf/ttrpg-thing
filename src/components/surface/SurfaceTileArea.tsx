import { useMutation, useQuery } from "convex/react"
import { sortBy } from "es-toolkit"
import { useRef, useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { type DerivedDragState, useDrag } from "../../hooks/useDrag.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { type Vec, vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"
import { SurfaceTile } from "./SurfaceTile.tsx"

export function SurfaceTileArea({ surface }: { surface: ClientSurface }) {
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
						<SurfaceTile
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
