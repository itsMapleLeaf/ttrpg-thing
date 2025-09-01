import { twMerge } from "tailwind-merge"
import type { ClientTile } from "../../../convex/tiles.ts"
import { ceilToNearest, getOptimizedImageUrl } from "../../lib/helpers.ts"

export type SurfaceTileProps = {
	tile: ClientTile
	selected: boolean
}

export function SurfaceTile({ tile, selected, ...props }: SurfaceTileProps) {
	return (
		<div
			{...props}
			className={twMerge(
				"absolute touch-none panel transition ease-out data-selected:border-primary-400",
			)}
			data-selected={selected || undefined}
			style={{
				width: tile.width,
				height: tile.height,
				backgroundImage:
					tile.assetUrl == null
						? undefined
						: `url(${getOptimizedImageUrl(tile.assetUrl, ceilToNearest(tile.width, 100))})`,
				backgroundPosition: "center top",
				backgroundSize: "cover",
			}}
		>
			<div
				className="relative size-full bg-primary-900/25 opacity-0 transition data-visible:opacity-100"
				data-visible={selected || undefined}
			></div>
		</div>
	)
}
