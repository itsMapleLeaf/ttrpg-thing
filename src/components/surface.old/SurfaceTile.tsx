import type { ClientTile } from "../../../convex/tiles.ts"
import { ceilToNearest, getOptimizedImageUrl } from "../../lib/helpers.ts"

export type SurfaceTileProps = {
	tile: Pick<ClientTile, "type" | "width" | "height" | "text" | "assetUrl">
	selected: boolean
}

export function SurfaceTile({ tile, selected }: SurfaceTileProps) {
	return (
		<div
			className="relative transition data-selected:border-primary-400"
			data-selected={selected || undefined}
			style={{ width: tile.width, height: tile.height }}
		>
			{tile.type === "label" ? (
				<div className="px-3 py-2 font-semibold">{tile.text}</div>
			) : (
				<div
					className="size-full panel"
					style={{
						backgroundImage:
							tile.assetUrl == null
								? undefined
								: `url(${getOptimizedImageUrl(tile.assetUrl, ceilToNearest(tile.width, 100))})`,
						backgroundPosition: "center top",
						backgroundSize: "cover",
					}}
				></div>
			)}
			<div
				className="absolute inset-0 rounded-md bg-primary-900/25 opacity-0 transition data-visible:opacity-100"
				data-visible={selected || undefined}
			></div>
		</div>
	)
}
