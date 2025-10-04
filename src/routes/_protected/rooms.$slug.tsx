import { Icon } from "@iconify/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api.js"
import { useStable } from "../../common/convex.ts"
import { ResourcePanel } from "../../components/resource-panel/ResourcePanel.tsx"
import { SidebarLayout } from "../../components/sidebar/SidebarLayout.tsx"
import { SurfaceViewer } from "../../components/surface.old/SurfaceViewer.tsx"

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

	const surface = useStable(
		useQuery(
			api.surfaces.get,
			room?.currentSurfaceId ? { id: room.currentSurfaceId } : "skip",
		),
	)

	return room ? (
		<SidebarLayout sidebar={<ResourcePanel roomId={room._id} />}>
			<div className="h-full bg-gray-950/25">
				{surface && <SurfaceViewer surface={surface} />}
			</div>
		</SidebarLayout>
	) : (
		<SidebarLayout>
			<div className="container flex flex-col items-center gap-6 py-16">
				<p className="max-w-2xs text-center text-lg text-balance opacity-70">
					This room doesn't exist, or you don't have access to it.
				</p>
				<Link to="/" className="button button-primary">
					<Icon icon="mingcute:home-4-fill" className="button-icon" />
					Return to Home
				</Link>
			</div>
		</SidebarLayout>
	)
}
