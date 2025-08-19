import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api.js"
import { AssetList } from "../../components/AssetList.js"
import { PageHeader } from "../../components/PageHeader.js"
import { Surface } from "../../components/Surface.js"

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
					<nav className="w-72 panel overflow-y-auto rounded-none border-0 border-r border-gray-700 bg-gray-800">
						<AssetList roomId={room._id} />
					</nav>
					<div className="flex-1">
						<Surface />
					</div>
				</div>
			)}
		</div>
	)
}
