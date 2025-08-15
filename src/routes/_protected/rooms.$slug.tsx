import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api.js"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
})

function RoomDetail() {
	const { slug } = Route.useParams()
	const room = useQuery(api.rooms.get, { slug })

	if (room === undefined) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<div className="flex items-center gap-3" aria-live="polite">
					<span className="loading loading-sm loading-spinner" />
					<span className="text-sm opacity-70">Loading room...</span>
				</div>
			</div>
		)
	}

	if (room === null) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Room not found</h1>
					<p className="mt-2 text-sm opacity-70">
						This room doesn't exist or you don't have access to it.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-3xl font-bold">Welcome to {room.name}!</h1>
		</div>
	)
}
