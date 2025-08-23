import { Tabs } from "@base-ui-components/react"
import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "../../../convex/_generated/api.js"
import { AssetList } from "../../components/AssetList.tsx"
import { PageHeader } from "../../components/PageHeader.tsx"
import { Surface } from "../../components/Surface.tsx"
import { EmptyState } from "../../ui/EmptyState.tsx"

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
	return (
		<Tabs.Root defaultValue="assets">
			<nav className="flex h-full w-72 flex-col panel overflow-y-auto rounded-none border-0 border-r border-gray-700 bg-gray-800">
				<Tabs.List className="relative isolate flex-center gap-2 border-b border-gray-700 p-2">
					<Tabs.Tab
						value="assets"
						className="flex-center size-8 opacity-50 transition hover:opacity-75 data-selected:text-primary-300 data-selected:opacity-100"
					>
						<Icon icon="mingcute:pic-fill" className="size-5" />
					</Tabs.Tab>
					<Tabs.Tab
						value="scenes"
						className="flex-center size-8 opacity-50 transition hover:opacity-75 data-selected:text-primary-300 data-selected:opacity-100"
					>
						<Icon icon="mingcute:clapperboard-fill" className="size-5" />
					</Tabs.Tab>
					<Tabs.Indicator className="absolute top-1/2 left-0 -z-1 size-8 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-1/2 rounded-sm bg-primary-500/25 transition-all duration-200 ease-in-out" />
				</Tabs.List>

				<Tabs.Panel value="assets" className="min-h-0 flex-1">
					<AssetList roomId={room._id} />
				</Tabs.Panel>
				<Tabs.Panel value="scenes" className="min-h-0 flex-1">
					<EmptyState
						icon="mingcute:clapperboard-line"
						message="No scenes found."
					/>
				</Tabs.Panel>
			</nav>
		</Tabs.Root>
	)
}
