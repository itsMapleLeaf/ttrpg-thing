import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useDrag } from "../../hooks/useDrag.ts"
import { useLocalStorage } from "../../hooks/useLocalStorage.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { useStable } from "../../hooks/useStable.ts"
import { getOptimizedImageUrl } from "../../lib/helpers.ts"
import { type Vec, vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"

export function SurfaceViewer({ surfaceId }: { surfaceId: Id<"surfaces"> }) {
	const surface = useStable(useQuery(api.surfaces.get, { id: surfaceId }))

	const [viewportOffset, setViewportOffset] = useLocalStorage({
		key: "SurfaceViewer:viewportOffset",
		fallback: vec(50),
		schema: type({ x: "number", y: "number" }),
	})

	return (
		surface && (
			<SurfacePanel
				surface={surface}
				viewportOffset={viewportOffset}
				onChangeViewportOffset={setViewportOffset}
			>
				<SurfaceTiles surface={surface} viewportOffset={viewportOffset} />
			</SurfacePanel>
		)
	)
}

function SurfaceTiles({
	surface,
	viewportOffset,
}: {
	surface: ClientSurface
	viewportOffset: Vec
}) {
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

	const [containerRect, setRect] = useState({
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	})
	const containerRef = useRef<HTMLDivElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: recalculate the container top-left when the viewport offset changes
	useEffect(() => {
		setRect((containerRef.current as HTMLDivElement).getBoundingClientRect())
	}, [viewportOffset])

	const {
		selection: selectedTileIds,
		isSelected,
		setSelection,
		clearSelection,
		...selection
	} = useSelection(tiles.map((t) => t._id) ?? [])

	const tileDrag = useDrag({
		buttons: ["left"],
		onEnd: (state) => {
			const tilesById = new Map(tiles.map((it) => [it._id, it]))
			const moved = vec.subtract(state.end, state.start)

			updateTiles({
				updates: [...selectedTileIds].flatMap((id) => {
					const tile = tilesById.get(id)
					if (!tile) return []

					const newPosition = vec.roundTo(
						vec.add(vec(tile.left, tile.top), moved),
						20,
					)

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

	const backgroundDrag = useDrag({
		buttons: ["left"],
		onMove: (state) => {
			const containerOffset = vec(containerRect.left, containerRect.top)

			const [selectStart, selectEnd] = vec.corners(state.start, state.end)

			const selectRect = [
				vec.subtract(selectStart, containerOffset),
				vec.subtract(selectEnd, containerOffset),
			] as const

			const overlappingTiles = tiles.filter((tile) => {
				const tileTopLeft = vec(tile.left, tile.top)

				const tileBottomRight = vec.add(
					tileTopLeft,
					vec(tile.width, tile.height),
				)

				return vec.intersects(...selectRect, tileTopLeft, tileBottomRight)
			})

			setSelection(overlappingTiles.map((it) => it._id))
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
			{tiles.map((tile) => {
				const selected = isSelected(tile._id)

				const position = vec.add(
					vec(tile.left, tile.top),
					selected ? tileDrag.state.delta : vec(0),
				)

				return (
					<div
						key={tile._id}
						className="absolute touch-none panel data-selected:border-primary-400"
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
					>
						{selected && (
							<div className="relative size-full bg-primary-900/25"></div>
						)}
					</div>
				)
			})}

			{(() => {
				if (backgroundDrag.state.status !== "dragging") return

				const containerOffset = vec(containerRect.left, containerRect.top)

				const [start, end] = vec.corners(
					vec.subtract(backgroundDrag.state.start, containerOffset),
					vec.subtract(backgroundDrag.state.end, containerOffset),
				)

				const width = end.x - start.x
				const height = end.y - start.y

				return (
					<div
						className="pointer-events-none fixed top-0 left-0 border border-primary-700 bg-primary-950/25"
						style={{
							translate: `${start.x}px ${start.y}px`,
							width,
							height,
						}}
					></div>
				)
			})()}
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
	viewportOffset,
	onChangeViewportOffset,
	children,
}: {
	surface: ClientSurface
	viewportOffset: Vec
	onChangeViewportOffset: (offset: Vec) => void
	children: React.ReactNode
}) {
	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const createTile = useMutation(api.tiles.create)
	const toast = useToastContext()

	const drag = useDrag({
		buttons: ["middle", "right"],
		onEnd: (state) => {
			onChangeViewportOffset(
				vec.add(viewportOffset, vec.subtract(state.end, state.start)),
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
				className="pointer-events-children absolute top-0 left-0 origin-top-left panel border-gray-700/50 bg-gray-900"
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
