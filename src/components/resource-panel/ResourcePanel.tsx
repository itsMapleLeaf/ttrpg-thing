import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { useStable } from "../../common/convex.ts"
import { ScrollArea } from "../../ui/ScrollArea.tsx"
import { AssetListSection } from "./AssetListSection.tsx"
import {
	ResourcePanelFilter,
	useResourceFilterState,
} from "./ResourcePanelFilter.tsx"
import { SurfaceListSection } from "./SurfaceListSection.tsx"

export function ResourcePanel({ roomId }: { roomId: Id<"rooms"> }) {
	const filterState = useResourceFilterState()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	const surfaces = useStable(
		useQuery(api.surfaces.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	return (
		<nav className="flex h-full flex-col">
			<ResourcePanelFilter {...filterState} />
			<ScrollArea className="min-h-0 flex-1 bg-gray-900">
				<AssetListSection roomId={roomId} assets={assets ?? []} />
				<SurfaceListSection roomId={roomId} surfaces={surfaces ?? []} />
			</ScrollArea>
		</nav>
	)
}
