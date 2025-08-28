import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useDrag } from "../../hooks/useDrag.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { getOptimizedImageUrl } from "../../lib/helpers.ts"
import { vec } from "../../lib/vec.ts"
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
			const moved = vec.subtract(state.end, state.start)

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
					selected ? drag.state.delta : vec(0),
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
						{...drag.getHandleProps({
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
	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const [offset, setOffset] = useState(vec.zero)
	const createTile = useMutation(api.tiles.create)
	const toast = useToastContext()

	const drag = useDrag({
		onDragEnd(state) {
			setOffset((current) =>
				vec.add(current, vec.subtract(state.end, state.start)),
			)
		},
	})

	let renderedOffset = offset
	if (drag.state.status === "dragging") {
		renderedOffset = vec.add(
			offset,
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
						left: event.clientX - rect.left - offset.x - 50,
						top: event.clientY - rect.top - offset.y - 50,
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
