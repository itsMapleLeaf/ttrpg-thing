import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useDrag } from "../../hooks/useDrag.ts"
import { useLocalStorage } from "../../hooks/useLocalStorage.ts"
import { useStable } from "../../hooks/useStable.ts"
import { vec } from "../../lib/vec.ts"
import { useToastContext } from "../../ui/Toast.tsx"
import { SurfaceTileArea } from "./SurfaceTileArea.tsx"

export function SurfaceViewer({ surfaceId }: { surfaceId: Id<"surfaces"> }) {
	const surface = useStable(useQuery(api.surfaces.get, { id: surfaceId }))

	return (
		surface && (
			<SurfacePanel surface={surface}>
				<SurfaceTileArea surface={surface} />
			</SurfacePanel>
		)
	)
}

export const SurfaceAssetDropData = type({
	assetId: type.string.as<Id<"assets">>(),
})

function SurfacePanel({
	surface,
	children,
}: {
	surface: ClientSurface
	children: React.ReactNode
}) {
	const surfaceWidth = 1000
	const surfaceHeight = 1000

	const createTile = useMutation(api.tiles.create)
	const toast = useToastContext()

	const [viewportOffset, setViewportOffset] = useLocalStorage({
		key: "SurfaceViewer:viewportOffset",
		fallback: vec(50),
		schema: type({ x: "number", y: "number" }),
	})

	const drag = useDrag({
		buttons: ["middle", "right"],
		onEnd: (state) => {
			setViewportOffset((current) =>
				vec.add(current, vec.subtract(state.end, state.start)),
			)
		},
	})

	let renderedOffset = viewportOffset
	if (drag.state.status === "dragging") {
		renderedOffset = vec.add(
			viewportOffset,
			vec.subtract(drag.state.end, drag.state.start),
		)
	}
	renderedOffset = vec.roundTo(renderedOffset, 1)

	return (
		<div
			className="relative h-full touch-none overflow-clip bg-gray-950/25"
			{...drag.getHandleProps()}
			onDragEnter={(event) => {
				event.preventDefault()
				event.dataTransfer.dropEffect = "copy"
			}}
			onDragOver={(event) => {
				event.preventDefault()
			}}
			onDrop={async (event) => {
				try {
					const DropDataFromJson =
						type("string.json.parse").to(SurfaceAssetDropData)

					const data = DropDataFromJson.assert(
						event.dataTransfer.getData("application/json"),
					)

					const rect = event.currentTarget.getBoundingClientRect()

					await createTile({
						surfaceId: surface._id,
						left: event.clientX - rect.left - viewportOffset.x - 50,
						top: event.clientY - rect.top - viewportOffset.y - 50,
						width: 100,
						height: 100,
						assetId: data.assetId,
					})
				} catch (error) {
					toast.error(String(error))
				}
			}}
		>
			<div
				className="pointer-events-children absolute top-0 left-0 origin-top-left panel overflow-visible border-gray-700/50 bg-gray-900"
				style={{
					width: surfaceWidth,
					height: surfaceHeight,
					translate: `${renderedOffset.x}px ${renderedOffset.y}px`,
				}}
			>
				{children}
			</div>
		</div>
	)
}
