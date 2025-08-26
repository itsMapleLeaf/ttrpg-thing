import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import {
	AssetListFilter,
	useAssetListFilterState,
} from "../../components/AssetListFilter.tsx"
import { ImageAssetSection } from "../../components/ImageAssetSection.tsx"
import { PageHeader } from "../../components/PageHeader.tsx"
import { Surface } from "../../components/Surface.tsx"
import { useStable } from "../../hooks/useStable.ts"
import { Button } from "../../ui/Button.tsx"
import { ScrollArea } from "../../ui/ScrollArea.tsx"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
	loader({ context, params }) {
		return context.convexClient.query(api.rooms.get, { slug: params.slug })
	},
})

function RoomDetail() {
	const loaderData = Route.useLoaderData()
	const { slug } = Route.useParams()
	const room = useQuery(api.rooms.get, { slug }) ?? loaderData
	const filterState = useAssetListFilterState()

	const assets =
		useStable(
			useQuery(
				api.assets.list,
				room
					? {
							roomId: room._id,
							searchTerm: filterState.searchTerm,
							order: filterState.sortOption.id,
						}
					: "skip",
			),
		) ?? []

	return (
		<div className="flex h-dvh flex-col">
			<PageHeader heading={room?.name || "Room not found"} />
			{room == null ? (
				<div className="container flex flex-col items-center gap-6 py-16">
					<p className="max-w-2xs text-center text-lg text-balance opacity-70">
						This room doesn't exist, or you don't have access to it.
					</p>
					<Link to="/" className="button button-primary">
						<Icon icon="mingcute:home-4-fill" className="button-icon" />
						Return to Home
					</Link>
				</div>
			) : (
				<div className="relative flex min-h-0 flex-1">
					<Surface />
					<RoomMenuToggle>
						<nav className="flex h-full w-72 flex-col panel overflow-y-auto border-gray-700 bg-gray-800">
							<AssetListFilter {...filterState} />
							<ScrollArea className="min-h-0 flex-1 bg-gray-900/50">
								<ImageAssetSection roomId={room._id} assets={assets} />
							</ScrollArea>
						</nav>
					</RoomMenuToggle>
				</div>
			)}
		</div>
	)
}

function RoomMenuToggle({ children }: { children: React.ReactNode }) {
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
