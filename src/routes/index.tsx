import { createFileRoute } from "@tanstack/react-router"
import { ChatPanel } from "./-components/ChatPanel.tsx"
import { PlayerHandPanel } from "./-components/PlayerHandPanel.tsx"
import { SurfaceViewer } from "./-components/surface/SurfaceViewer.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
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
	)
}
