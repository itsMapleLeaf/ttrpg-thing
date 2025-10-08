import { createFileRoute } from "@tanstack/react-router"
import { ChatPanel } from "./-components/ChatPanel.tsx"
import { PlayerHandPanel } from "./-components/PlayerHandPanel.tsx"
import { SurfaceViewer } from "./-components/surface/SurfaceViewer.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="isolate grid h-dvh grid-cols-[1fr_--spacing(72)]">
			<div className="relative -z-10 flex flex-col items-center">
				<div className="absolute inset-0">
					<SurfaceViewer />
				</div>
				<div className="pointer-events-children absolute bottom-0 p-2">
					<PlayerHandPanel />
				</div>
			</div>
			<ChatPanel />
		</div>
	)
}
