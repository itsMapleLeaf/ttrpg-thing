import { convexQuery } from "@convex-dev/react-query"
import { Icon } from "@iconify/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../convex/_generated/api.js"
import { PageHeader } from "../../components/PageHeader.js"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
})

function RoomDetail() {
	const { slug } = Route.useParams()
	const { data: room } = useSuspenseQuery(convexQuery(api.rooms.get, { slug }))

	return (
		<>
			<PageHeader heading={room?.name ?? "Room not found"} />
			{room ? (
				<div className="container">
					<h2 className="text-3xl font-semibold">Welcome to {room.name}!</h2>
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
		</>
	)
}
