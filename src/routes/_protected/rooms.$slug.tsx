import { convexQuery } from "@convex-dev/react-query"
import { Icon } from "@iconify/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../convex/_generated/api.js"
import { AssetList } from "../../components/AssetList.js"
import { PageHeader } from "../../components/PageHeader.js"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
})

function RoomDetail() {
	const { slug } = Route.useParams()
	const { data: room } = useSuspenseQuery(convexQuery(api.rooms.get, { slug }))

	return (
		<div className="flex h-dvh flex-col">
			<PageHeader heading={room?.name ?? "Room not found"} />
			{room ? (
				<div className="flex min-h-0 flex-1">
					<nav className="w-64 overflow-y-auto border-r border-base-100 bg-base-200">
						<AssetList roomId={room._id} />
					</nav>
					<div className="flex-1 px-4 py-3">content</div>
				</div>
			) : (
				<div className="container flex flex-col items-center gap-6 py-16">
					<p className="max-w-2xs text-center text-lg text-balance opacity-70">
						This room doesn't exist, or you don't have access to it.
					</p>
					<Link to="/" className="btn btn-primary">
						<Icon icon="mingcute:home-4-fill" className="btn-icon" />
						Return to Home
					</Link>
				</div>
			)}
		</div>
	)
}
