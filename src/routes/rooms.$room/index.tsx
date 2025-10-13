import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api.js"
import { ChatPanel } from "./-components/ChatPanel.tsx"
import { PlayerHandPanel } from "./-components/PlayerHandPanel.tsx"
import { SurfaceViewer } from "./-components/surface/SurfaceViewer.tsx"
import { RoomProvider } from "./-local/rooms.tsx"

export const Route = createFileRoute("/rooms/$room/")({
	component: RouteComponent,
})

function RouteComponent() {
	const params = Route.useParams()
	const room = useQuery(api.rooms.getBySlug, { slug: params.room })
	return room === undefined ? (
		<p>loading...</p>
	) : room === null ? (
		<p>not found</p>
	) : (
		<RoomProvider value={room}>
			<div className="relative isolate flex h-dvh">
				<div className="absolute inset-0">
					<SurfaceViewer />
				</div>
				<div className="flex flex-1 items-end justify-center p-2">
					<PlayerHandPanel />
				</div>
				<div className="w-72">
					<ChatPanel />
				</div>
			</div>
		</RoomProvider>
	)
}
