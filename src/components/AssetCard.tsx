import { Icon } from "@iconify/react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { ClientAsset } from "../../convex/assets.ts"
import { getOptimizedImageUrl } from "../lib/helpers.ts"
import { SmartImage } from "../ui/SmartImage.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"
import type { SurfaceAssetDropData } from "./surface/SurfaceViewer.tsx"

export function AssetCard({
	asset,
	selected,
	onChangeSelected,
}: {
	asset: ClientAsset
	selected: boolean
	onChangeSelected: (selected: boolean) => void
}) {
	const updateAsset = useMutation(api.assets.update)
	return (
		<div
			className="w-full panel bg-gray-950/40 outline-2 outline-transparent transition-colors"
			draggable
			onDragStart={(event) => {
				const dropData: typeof SurfaceAssetDropData.inferIn = {
					assetId: asset._id,
				}
				event.dataTransfer.setData("application/json", JSON.stringify(dropData))
			}}
		>
			<label className="group relative block aspect-square select-none">
				{asset.imageUrl ? (
					<SmartImage
						src={getOptimizedImageUrl(asset.imageUrl, 200).href}
						alt=""
						className="size-full object-cover object-top"
						draggable={false}
					/>
				) : (
					<div className="flex-center h-full">
						<Icon
							icon="mingcute:file-unknown-line"
							className="size-12 opacity-50"
						/>
					</div>
				)}

				<div
					className="absolute right-0 bottom-0 block p-2 opacity-0 transition-opacity group-hover:opacity-100 data-selected:opacity-100"
					data-selected={selected || undefined}
				>
					<div className="sr-only">Selected</div>
					<input
						type="checkbox"
						className="block size-5 accent-primary-400"
						checked={selected}
						onChange={(event) => onChangeSelected(event.target.checked)}
					/>
				</div>

				<div
					className="pointer-events-none absolute inset-0 bg-primary-400/25 opacity-0 transition-opacity data-visible:opacity-100"
					data-visible={selected || undefined}
				/>
			</label>

			<WithTooltip content={asset.name} positionerProps={{ side: "bottom" }}>
				<button
					type="button"
					className="group flex h-6.5 w-full items-center justify-center gap-1 px-2 text-xs/tight font-semibold hover:bg-gray-800"
					onClick={() => {
						const newName = prompt("New name?", asset.name)?.trim()
						if (!newName) return
						updateAsset({
							id: asset._id,
							patch: { name: newName },
						})
					}}
				>
					<div className="truncate">{asset.name}</div>
					<div className="flex h-4 w-0 justify-center transition-[width] group-hover:w-4">
						<Icon
							icon="mingcute:pencil-fill"
							className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
						/>
					</div>
				</button>
			</WithTooltip>
		</div>
	)
}
