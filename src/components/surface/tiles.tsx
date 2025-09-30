import { useState } from "react"
import { type Vec, vec } from "../../common/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"
import { GRID_SNAP, SURFACE_SIZE } from "./constants.ts"

export type TileInstance = {
	id: string
	position: Vec
	size: Vec
	order: number
	imageUrl: string
}

export function useTiles() {
	const [tiles, setTiles] = useState<TileInstance[]>([])
	const toast = useToastContext()

	const importAssetTiles = (files: File[], position: Vec, size: Vec) => {
		const now = Date.now()

		for (const [index, file] of files.entries()) {
			try {
				const id = crypto.randomUUID()
				const url = URL.createObjectURL(file)
				// const bitmap = await createImageBitmap(file)

				const tilePosition = vec
					.with(position)
					.subtract(vec.divide(size, 2))
					.add(index * GRID_SNAP)
					.clamp(vec.zero, vec.subtract(SURFACE_SIZE, size))
					.result()

				setTiles((assets) => [
					...assets,
					{
						id,
						imageUrl: url,
						position: tilePosition,
						size,
						order: now + index,
					},
				])
			} catch (error) {
				toast.error(`Failed to load image: ${(error as Error).message}`)
			}
		}
	}

	const updateTile = (
		id: string,
		update: (current: TileInstance) => Partial<TileInstance>,
	) => {
		setTiles((assets) =>
			assets.map((asset) => {
				if (asset.id !== id) return asset
				return { ...asset, ...update(asset) }
			}),
		)
	}

	const removeTiles = (ids: string[]) => {
		const idSet = new Set(ids)
		setTiles((assets) => assets.filter((asset) => !idSet.has(asset.id)))
	}

	return { tiles, importAssetTiles, updateTile, removeTiles }
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
	imageUrl: string
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
						background: `url(${imageUrl}) center / cover`,
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
