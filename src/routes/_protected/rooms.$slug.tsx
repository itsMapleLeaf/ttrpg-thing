import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api.js"
import { PageHeader } from "../../components/PageHeader.tsx"
import { ResourcePanel } from "../../components/resource-panel/ResourcePanel.tsx"
import { SurfaceViewer } from "../../components/surface/SurfaceViewer.tsx"

export const Route = createFileRoute("/_protected/rooms/$slug")({
	component: RoomDetail,
	loader({ context, params }) {
		return context.convexClient.query(api.rooms.getBySlug, {
			slug: params.slug,
		})
	},
})

function RoomDetail() {
	const loaderData = Route.useLoaderData()
	const { slug } = Route.useParams()
	const room = useQuery(api.rooms.getBySlug, { slug }) ?? loaderData

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
				<div className="relative flex-1">
					<SurfaceViewer />
					<div className="pointer-events-children absolute inset-y-0 left-0 p-2">
						<ResourcePanel roomId={room._id} />
					</div>
				</div>
			)}
		</div>
	)
}
