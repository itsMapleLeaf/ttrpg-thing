import { twMerge } from "tailwind-merge"
import type { ClientTile } from "../../../convex/tiles.ts"
import { ceilToNearest, getOptimizedImageUrl } from "../../lib/helpers.ts"
import type { Vec } from "../../lib/vec.ts"

export type SurfaceTileProps = {
	tile: ClientTile
	position: Vec
	selected: boolean
	dragging: boolean
	order: number | undefined
}

export function SurfaceTile({
	tile,
	position,
	selected,
	dragging,
	order,
	...props
}: SurfaceTileProps) {
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
