import { Tabs } from "@base-ui-components/react"
import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "../../../convex/_generated/api.js"
import { ImageAssetList } from "../../components/ImageAssetList.tsx"
import { PageHeader } from "../../components/PageHeader.tsx"
import { ResourceListFilterProvider } from "../../components/ResourceList.tsx"
import { SceneList } from "../../components/SceneList.tsx"
import { Surface } from "../../components/Surface.tsx"

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
				<div className="flex min-h-0 flex-1">
					<RoomSidebar room={room} />
					<div className="flex-1">
						<Surface />
					</div>
				</div>
			)}
		</div>
	)
}

function RoomSidebar({
	room,
}: {
	room: NonNullable<FunctionReturnType<typeof api.rooms.get>>
}) {
	const tabs = [
		{
			value: "assets",
			icon: "mingcute:pic-fill",
			content: <ImageAssetList roomId={room._id} />,
		},
		{
			value: "scenes",
			icon: "mingcute:clapperboard-fill",
			content: <SceneList roomId={room._id} />,
		},
	]

	return (
		<Tabs.Root defaultValue="assets">
			<nav className="flex h-full w-72 flex-col panel overflow-y-auto rounded-none border-0 border-r border-gray-700 bg-gray-800">
				<Tabs.List className="relative isolate flex-center gap-2 border-b border-gray-700 p-2">
					{tabs.map((tab) => (
						<Tabs.Tab
							key={tab.value}
							value={tab.value}
							className="flex-center size-8 opacity-50 transition hover:opacity-75 data-selected:text-primary-300 data-selected:opacity-100"
						>
							<Icon icon={tab.icon} className="size-5" />
						</Tabs.Tab>
					))}
					<Tabs.Indicator className="absolute top-1/2 left-0 -z-1 size-8 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-1/2 rounded-sm bg-primary-500/25 transition-all duration-200 ease-in-out" />
				</Tabs.List>

				<ResourceListFilterProvider>
					{tabs.map((tab) => (
						<Tabs.Panel
							key={tab.value}
							value={tab.value}
							className="min-h-0 flex-1"
						>
							{tab.content}
						</Tabs.Panel>
					))}
				</ResourceListFilterProvider>
			</nav>
		</Tabs.Root>
	)
}
