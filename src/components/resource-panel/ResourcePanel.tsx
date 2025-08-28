import { useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { useStable } from "../../hooks/useStable.ts"
import { Button } from "../../ui/Button.tsx"
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
		<ResourcePanelToggle>
			<nav className="flex h-full w-full max-w-72 flex-col panel border-gray-700 bg-gray-800">
				<ResourcePanelFilter {...filterState} />
				<ScrollArea className="min-h-0 flex-1 bg-gray-900/75">
					<AssetListSection roomId={roomId} assets={assets ?? []} />
					<SurfaceListSection roomId={roomId} surfaces={surfaces ?? []} />
				</ScrollArea>
			</nav>
		</ResourcePanelToggle>
	)
}

function ResourcePanelToggle({ children }: { children: React.ReactNode }) {
	const [expanded, setExpanded] = useState(true)
	return (
		<div className="pointer-events-children relative flex h-full flex-col justify-end gap-2">
			{expanded ? (
				<>
					<div className="min-h-0 flex-1">{children}</div>
					<div className="pointer-events-children">
						<Button
							icon="mingcute:close-fill"
							shape="square"
							onClick={() => setExpanded(false)}
						>
							Close menu
						</Button>
					</div>
				</>
			) : (
				<Button
					icon="mingcute:menu-fill"
					shape="square"
					onClick={() => setExpanded(true)}
				>
					Open menu
				</Button>
			)}
		</div>
	)
}
