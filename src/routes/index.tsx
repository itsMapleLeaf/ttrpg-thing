import { createFileRoute } from "@tanstack/react-router"
import { SurfaceViewer } from "../components/SurfaceViewer.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return <SurfaceViewer />
}
