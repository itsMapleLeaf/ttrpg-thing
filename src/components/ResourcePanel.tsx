import { useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useStable } from "../hooks/useStable.ts"
import { Button } from "../ui/Button.tsx"
import { ScrollArea } from "../ui/ScrollArea.tsx"
import { ResourcePanelAssetListSection } from "./ResourcePanelAssetListSection.tsx"
import {
	ResourcePanelFilter,
	useResourceFilterState,
} from "./ResourcePanelFilter.tsx"

export function ResourcePanel({ roomId }: { roomId: Id<"rooms"> }) {
	const filterState = useResourceFilterState()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	return (
		<ResourcePanelToggle>
			<nav className="flex h-full w-72 flex-col panel overflow-y-auto border-gray-700 bg-gray-800">
				<ResourcePanelFilter {...filterState} />
				<ScrollArea className="min-h-0 flex-1 bg-gray-900/50">
					<ResourcePanelAssetListSection
						roomId={roomId}
						assets={assets ?? []}
					/>
				</ScrollArea>
			</nav>
		</ResourcePanelToggle>
	)
}

function ResourcePanelToggle({ children }: { children: React.ReactNode }) {
	const [expanded, setExpanded] = useState(false)
	return (
		<div className="pointer-events-children absolute inset-y-0 left-0 p-2">
			{expanded ? (
				<div className="relative h-full">
					{children}
					<div className="absolute top-0 left-full pl-2">
						<Button
							icon="mingcute:close-fill"
							shape="square"
							tooltipProps={{ positionerProps: { side: "right" } }}
							onClick={() => setExpanded(false)}
						>
							Close menu
						</Button>
					</div>
				</div>
			) : (
				<Button
					icon="mingcute:menu-fill"
					shape="square"
					tooltipProps={{ positionerProps: { side: "right" } }}
					onClick={() => setExpanded(true)}
				>
					Open menu
				</Button>
			)}
		</div>
	)
}
