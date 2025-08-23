import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useStable } from "../hooks/useStable.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../lib/helpers.ts"
import { Loading } from "../ui/Loading.tsx"
import {
	ResourceCard,
	ResourceList,
	useResourceListFilterContext,
} from "./ResourceList.tsx"

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
	const updateAsset = useMutation(api.assets.update)
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
					{items.map(({ resource, selected, onChangeSelected }) => (
						<ResourceCard
							key={resource._id}
							name={resource.name}
							imageUrl={
								resource.url
									? getOptimizedImageUrl(resource.url, 150).href
									: undefined
							}
							selected={selected}
							onChangeSelected={onChangeSelected}
							onChangeName={(name) => updateAsset({ id: resource._id, name })}
						/>
					))}
				</div>
			)}
		/>
	)
}
