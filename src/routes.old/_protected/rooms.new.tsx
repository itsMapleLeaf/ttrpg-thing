import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../convex/_generated/api.js"
import { CreateRoomForm } from "../../components/CreateRoomForm.tsx"
import { SidebarLayout } from "../../components/sidebar/SidebarLayout.tsx"

export const Route = createFileRoute("/_protected/rooms/new")({
	component: Home,
	loader: ({ context }) => {
		return context.convexClient.query(api.rooms.list)
	},
})

function Home() {
	return (
		<SidebarLayout>
			<div className="container grid h-full max-w-2xl content-center">
				<CreateRoomForm />
			</div>
		</SidebarLayout>
	)
}
