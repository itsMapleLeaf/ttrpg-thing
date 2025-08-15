import { convexQuery } from "@convex-dev/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../convex/_generated/api.js"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
})

function RoomDetail() {
	const { slug } = Route.useParams()
	const { data: room } = useSuspenseQuery(convexQuery(api.rooms.get, { slug }))

	if (!room) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-center">
					<h2 className="text-2xl font-semibold">Room not found</h2>
					<p className="mt-2 text-sm opacity-70">
						This room doesn't exist or you don't have access to it.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6">
			<h2 className="text-3xl font-semibold">Welcome to {room.name}!</h2>
		</div>
	)
}
