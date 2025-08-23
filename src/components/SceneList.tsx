import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useStable } from "../hooks/useStable.ts"
import { getOptimizedImageUrl } from "../lib/helpers.ts"
import { Loading } from "../ui/Loading.tsx"
import {
	ResourceCard,
	ResourceList,
	useResourceListFilterContext,
} from "./ResourceList.tsx"

export function SceneList({ roomId }: { roomId: Id<"rooms"> }) {
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
			resources={assets.filter((it) => it.type === "scene")}
			getResourceId={(asset) => asset._id}
			createResource={async () => {
				const name = prompt("Scene name?", "New Scene")
				if (!name) return
				await createAsset({
					name,
					roomId,
					type: "scene",
					scene: {},
				})
			}}
			removeManyResources={(ids) => removeManyAssets({ ids })}
			renderList={(items) => (
				<div className="grid grid-cols-1 gap-2">
					{items.map(({ resource, selected, onChangeSelected }) => (
						<ResourceCard
							key={resource._id}
							name={resource.name}
							imageUrl={
								resource.image?.imageUrl
									? getOptimizedImageUrl(resource.image.imageUrl, 150).href
									: undefined
							}
							imageWrapperClass="aspect-[16/9]"
							selected={selected}
							onChangeSelected={onChangeSelected}
							onChangeName={(name) =>
								updateAsset({
									id: resource._id,
									patch: { name },
								})
							}
						/>
					))}
				</div>
			)}
		/>
	)
}
