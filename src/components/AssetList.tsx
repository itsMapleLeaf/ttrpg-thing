import { Icon } from "@iconify/react/dist/iconify.js"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientAsset } from "../../convex/assets.ts"
import { useStable } from "../hooks/useStable.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../lib/helpers.ts"
import { Loading } from "../ui/Loading.tsx"
import { SmartImage } from "../ui/SmartImage.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"
import { ResourceList, useResourceListFilterContext } from "./ResourceList.tsx"

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const { searchTerm, sortOption } = useResourceListFilterContext()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm,
			order: sortOption.id,
		}),
	)

	const createAsset = useMutation(api.assets.create)
	const removeManyAssets = useMutation(api.assets.removeMany)

	return assets === undefined ? (
		<Loading />
	) : (
		<ResourceList
			resources={assets}
			getResourceId={(asset) => asset._id}
			createResource={async ({ fileName, fileId }) => {
				await createAsset({
					name: titleifyFileName(fileName),
					fileId,
					roomId,
				})
			}}
			removeManyResources={(ids) => removeManyAssets({ ids })}
			renderList={(items) => (
				<div className="grid grid-cols-2 gap-2">
					{items.map(({ resource, selected, onSelectedChange }) => (
						<AssetCard
							key={resource._id}
							asset={resource}
							selected={selected}
							onSelectedChange={onSelectedChange}
						/>
					))}
				</div>
			)}
		/>
	)
}

function AssetCard({
	asset,
	selected,
	onSelectedChange,
}: {
	asset: ClientAsset
	selected: boolean
	onSelectedChange: (selected: boolean) => void
}) {
	const updateAsset = useMutation(api.assets.update)
	return (
		<div className="panel bg-gray-950/40 outline-2 outline-transparent transition-colors">
			<label className="group relative block aspect-square">
				{asset.url ? (
					<SmartImage
						src={getOptimizedImageUrl(asset.url, 150).href}
						alt={asset.name}
						className="size-full object-cover object-top"
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
						onChange={(event) => onSelectedChange(event.target.checked)}
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

						updateAsset({ id: asset._id, name: newName })
					}}
				>
					<div className="truncate">{asset.name}</div>
					<div className="flex h-4 w-0 justify-end transition-[width] group-hover:w-4">
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
