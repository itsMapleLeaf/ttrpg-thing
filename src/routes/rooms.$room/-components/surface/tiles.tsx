import { useMutation, useQuery } from "convex/react"
import { createContext, use, useState } from "react"
import { api } from "../../../../../convex/_generated/api.js"
import type { Id } from "../../../../../convex/_generated/dataModel"
import type {
	ClientTile,
	CreateManyInput,
} from "../../../../../convex/tiles.ts"
import { useDrag } from "../../../../common/drag.ts"
import {
	ceilToNearest,
	getErrorMessage,
	getOptimizedImageUrl,
} from "../../../../common/helpers.ts"
import {
	type SelectionHook,
	useSelection,
} from "../../../../common/selection.ts"
import { type Vec, vec } from "../../../../common/vec.ts"
import { useUploadImage } from "../../../../core/useUploadImage.ts"
import { useToastContext } from "../../../../ui/Toast.tsx"
import { useRoomContext } from "../../-local/rooms.tsx"
import {
	GRID_SNAP,
	SURFACE_HEIGHT,
	SURFACE_SIZE,
	SURFACE_WIDTH,
} from "./constants.ts"
import type { useViewport } from "./viewport.ts"

const TileSelectionContext = createContext<SelectionHook<Id<"tiles">> | null>(
	null,
)

export function TileSelectionProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const room = useRoomContext()
	const tiles = useQuery(api.tiles.list, { roomId: room._id }) ?? []
	const tileSelection = useSelection(tiles.map((a) => a._id))
	return (
		<TileSelectionContext.Provider value={tileSelection}>
			{children}
		</TileSelectionContext.Provider>
	)
}

export function useTileSelection() {
	const tileSelection = use(TileSelectionContext)
	if (!tileSelection) {
		throw new Error(
			"useTileSelection must be used within a TileSelectionProvider",
		)
	}
	return tileSelection
}

export function useTileActions() {
	const room = useRoomContext()
	const createMany = useMutation(api.tiles.createMany)

	const updateMany = useMutation(api.tiles.updateMany).withOptimisticUpdate(
		(store, args) => {
			for (const query of store.getAllQueries(api.tiles.list)) {
				if (!query.value) continue
				const updatedTiles = query.value.map((tile) => {
					const updated = args.items.find((item) => item.id === tile._id)
					if (updated) {
						return { ...tile, ...updated.data }
					}
					return tile
				})
				store.setQuery(api.tiles.list, query.args, updatedTiles)
			}
		},
	)

	const deleteMany = useMutation(api.tiles.deleteMany).withOptimisticUpdate(
		(store, args) => {
			for (const query of store.getAllQueries(api.tiles.list)) {
				if (!query.value) continue
				const remainingTiles = query.value.filter(
					(tile) => !args.ids.includes(tile._id),
				)
				store.setQuery(api.tiles.list, query.args, remainingTiles)
			}
		},
	)

	const toast = useToastContext()
	const uploadImage = useUploadImage()

	async function createManyFromFiles(files: File[], position: Vec, size: Vec) {
		const now = Date.now()

		type ItemResult =
			| { success: true; input: CreateManyInput }
			| { success: false; error: string }

		const itemResults = await Promise.all(
			files.map(async (file, index): Promise<ItemResult> => {
				try {
					const imageId = await uploadImage(file)

					const tilePosition = vec
						.with(position)
						.subtract(vec.divide(size, 2))
						.add(index * GRID_SNAP)
						.clamp(vec.zero, vec.subtract(SURFACE_SIZE, size))
						.result()

					return {
						success: true,
						input: {
							imageId,
							position: tilePosition,
							size,
							orderTime: now,
							orderIndex: index,
							roomId: room._id,
						},
					}
				} catch (error) {
					return { success: false, error: getErrorMessage(error) }
				}
			}),
		)

		if (itemResults.length === 0) {
			return
		}

		const failedResults = itemResults.filter((result) => !result.success)
		for (const result of failedResults) {
			toast.error(`Failed to upload image: ${result.error}`)
		}

		await createMany({
			items: itemResults
				.filter((item) => item.success)
				.map((item) => item.input),
		})
	}

	return {
		createMany,
		createManyFromFiles,
		updateMany,
		deleteMany,
	}
}

export function SurfaceTileLayer({
	tiles,
	tileSelection,
	viewport,
}: {
	tiles: ClientTile[]
	tileSelection: SelectionHook<Id<"tiles">>
	viewport: ReturnType<typeof useViewport>
}) {
	const [baseDragDelta, setBaseDragDelta] = useState(vec.zero)
	const dragDelta = vec.multiply(baseDragDelta, 1 / viewport.scale)
	const tileActions = useTileActions()

	const drag = useDrag({
		buttons: ["left"],
		onStart() {
			const now = Date.now()

			const tilesById = new Map(tiles.map((tile) => [tile._id, tile]))

			tileActions.updateMany({
				items: [...tileSelection.items].flatMap((id, index) => {
					const tile = tilesById.get(id)
					if (!tile) return []
					return {
						id,
						data: {
							orderTime: now,
							orderIndex: index,
							position: vec.roundTo(tile.position, GRID_SNAP),
						},
					}
				}),
			})
		},

		onMove(state) {
			setBaseDragDelta(state.delta)
		},

		onEnd() {
			const tilesById = new Map(tiles.map((tile) => [tile._id, tile]))

			tileActions.updateMany({
				items: [...tileSelection.items].flatMap((id) => {
					const tile = tilesById.get(id)
					if (!tile) return []
					return {
						id,
						data: {
							position: vec.clamp(
								vec.add(tile.position, dragDelta),
								vec.zero,
								vec.subtract(vec(SURFACE_WIDTH, SURFACE_HEIGHT), tile.size),
							),
						},
					}
				}),
			})
		},
	})

	const isDraggingAsset = (tileId: Id<"tiles">) =>
		tileSelection.has(tileId) && drag.isDragging

	const getRenderedAssetPosition = (tile: ClientTile) => {
		let position = vec.roundTo(tile.position, GRID_SNAP)
		if (isDraggingAsset(tile._id)) {
			position = vec.add(position, dragDelta)
		}
		return position
	}

	return tiles
		.sort((a, b) => a.orderTime + a.orderIndex - (b.orderTime + b.orderIndex))
		.map((tile) => (
			<SurfaceTile
				key={tile._id}
				id={tile._id}
				imageUrl={
					tile.imageUrl &&
					getOptimizedImageUrl(tile.imageUrl, ceilToNearest(tile.size.x, 100))
						.href
				}
				position={getRenderedAssetPosition(tile)}
				size={tile.size}
				dragging={isDraggingAsset(tile._id)}
				selected={tileSelection.has(tile._id)}
				onPointerDown={(event) => {
					if (event.button === 0) {
						if (event.ctrlKey || event.shiftKey) {
							tileSelection.toggleItemSelected(tile._id)
						} else if (!tileSelection.has(tile._id)) {
							tileSelection.setSelectedItems([tile._id])
						}
					}
					drag.handlePointerDown(event)
				}}
			/>
		))
}

export function SurfaceTile({
	id,
	position,
	size,
	imageUrl,
	selected,
	dragging,
	onPointerDown,
}: {
	id: string
	position: Vec
	size: Vec
	imageUrl: string | null
	selected: boolean
	dragging: boolean
	onPointerDown: (event: React.PointerEvent) => void
}) {
	return (
		<div
			style={{ translate: vec.css.translate(position) }}
			data-asset-id={id}
			data-dragging={dragging}
			className="absolute top-0 left-0 transition-transform duration-100 ease-out will-change-transform data-[dragging=true]:duration-25"
			onPointerDown={onPointerDown}
		>
			<div className="relative">
				<div
					className="panel rounded opacity-100 shadow-black/50 transition data-[dragging=true]:opacity-75 data-[dragging=true]:shadow-lg"
					data-dragging={dragging}
					style={{
						background: imageUrl ? `url(${imageUrl}) center / cover` : "",
						...vec.asSize(size),
					}}
				></div>
				<div
					className="absolute -inset-1 rounded-md border border-primary-400 bg-primary-500/20 opacity-0 transition data-[visible=true]:opacity-100"
					data-visible={selected}
				></div>
			</div>
		</div>
	)
}
