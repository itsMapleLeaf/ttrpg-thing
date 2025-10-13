import { useQuery } from "convex/react"
import { type CSSProperties, useRef, useState } from "react"
import { api } from "../../../../../convex/_generated/api.js"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { useWindowEvent, useWindowFileDrop } from "../../../../common/dom.ts"
import { useDrag } from "../../../../common/drag.ts"
import { vec } from "../../../../common/vec.ts"
import { Portal } from "../../../../ui/Portal.tsx"
import { useToastContext } from "../../../../ui/Toast.tsx"
import { useRoomContext } from "../../-local/rooms.tsx"
import {
	AssetDropOverlay,
	type AssetImportPreset,
} from "./AssetDropOverlay.tsx"
import {
	ACCEPTED_FILE_TYPES,
	SURFACE_HEIGHT,
	SURFACE_WIDTH,
} from "./constants.ts"
import {
	SurfaceTileLayer,
	TileSelectionProvider,
	useTileActions,
	useTileSelection,
} from "./tiles.tsx"
import { useViewport } from "./viewport.ts"

export function SurfaceViewer() {
	return (
		<TileSelectionProvider>
			<SurfaceViewerInner />
		</TileSelectionProvider>
	)
}

function SurfaceViewerInner() {
	const room = useRoomContext()
	const tiles = useQuery(api.tiles.list, { roomId: room._id }) ?? []
	const tileSelection = useTileSelection()
	const tileActions = useTileActions()

	const panelRef = useRef<HTMLDivElement>(null)
	const viewport = useViewport()
	const toast = useToastContext()
	const fileDrop = useWindowFileDrop()
	const [backgroundUrl, setBackgroundUrl] = useState<string>()

	// precompute asset rectangles once on drag start for performance
	const tileElementRects = useRef<{ id: Id<"tiles">; rect: DOMRect }[]>([])

	const areaSelect = useDrag({
		buttons: ["left"],

		onStart() {
			tileElementRects.current = [
				...(panelRef.current as HTMLElement).querySelectorAll(
					`[data-asset-id]`,
				),
			].map((element) => ({
				id: (element as HTMLElement).dataset.assetId as Id<"tiles">,
				rect: element.getBoundingClientRect(),
			}))
		},

		onMove(state) {
			const [start, end] = vec.corners(state.start, state.end)

			// find overlapping assets by checking element bounding boxes
			const overlappedAssetElements = tileElementRects.current.filter(
				({ rect }) =>
					vec.intersects(
						vec(rect.left, rect.top),
						vec(rect.right, rect.bottom),
						start,
						end,
					),
			)

			tileSelection.setSelectedItems(
				overlappedAssetElements.map((entry) => entry.id),
			)
		},
	})

	useWindowEvent("keydown", (event) => {
		const inputHasFocus =
			document.activeElement?.tagName === "INPUT" ||
			document.activeElement?.tagName === "TEXTAREA" ||
			(document.activeElement as HTMLElement)?.isContentEditable
		if (inputHasFocus) return

		if (event.key === "Delete" || event.key === "Backspace") {
			if (tileSelection.items.size > 0) {
				event.preventDefault()
				tileActions.deleteMany({ ids: Array.from(tileSelection.items) })
				tileSelection.clear()
			}
		}
	})

	const handleRootPointerDown = (event: React.PointerEvent) => {
		if (event.button === 0 && !event.ctrlKey && !event.shiftKey) {
			tileSelection.clear()
		}
		areaSelect.handlePointerDown(event)
	}

	const handleAssetDrop = (preset: AssetImportPreset, files: File[]): void => {
		const imageFiles = []
		for (const file of files) {
			if (!ACCEPTED_FILE_TYPES.has(file.type)) {
				toast.error(`Unsupported file type: ${file.type}`)
				continue
			}

			imageFiles.push(file)
		}

		if (imageFiles[0] == null) {
			toast.error("No valid image files to import")
			return
		}

		if (preset.name !== "Scene") {
			tileActions.createManyFromFiles(
				files,
				vec
					.with(window.innerWidth, window.innerHeight)
					.divide(2)
					.subtract(viewport.offset)
					.multiply(1 / viewport.scale)
					.result(),
				preset.size,
			)
			return
		}

		if (imageFiles.length > 1) {
			toast.error("Only one image can be used for the background")
			return
		}

		const objectUrl = URL.createObjectURL(imageFiles[0])
		setBackgroundUrl(objectUrl)
	}

	const rootStyle: CSSProperties = {
		backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
		backgroundSize: "cover",
		backgroundPosition: "center",
	}

	const panelWrapperStyle: CSSProperties = {
		translate: vec.css.translate(vec.add(viewport.offset, viewport.drag.delta)),
		scale: viewport.scale,
	}

	const panelStyle: CSSProperties = {
		width: SURFACE_WIDTH,
		height: SURFACE_HEIGHT,
		backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
		backgroundSize: "cover",
		backgroundPosition: "center",
	}

	return (
		<>
			<div
				className="relative h-dvh touch-none overflow-clip"
				style={rootStyle}
				onPointerDown={handleRootPointerDown}
			>
				<div className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur" />

				<div
					className="relative size-full touch-none"
					onPointerDown={viewport.drag.handlePointerDown}
					ref={viewport.ref}
				>
					<div
						className="absolute inset-0 origin-top-left transition-transform duration-150 ease-out data-dragging:duration-75"
						data-dragging={viewport.drag.isDragging || undefined}
						style={panelWrapperStyle}
					>
						<div
							ref={panelRef}
							className="relative isolate size-full panel overflow-visible"
							style={panelStyle}
						>
							<div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/40" />
							<SurfaceTileLayer
								tiles={tiles}
								tileSelection={tileSelection}
								viewport={viewport}
							/>
						</div>
					</div>
				</div>
			</div>

			{areaSelect.isDragging && (
				<Portal>
					<div
						className="pointer-events-none fixed top-0 left-0 border border-primary-400 bg-primary-700/25"
						style={{
							translate: vec.css.translate(
								vec.min(areaSelect.start, areaSelect.end),
							),
							...vec.asSize(vec.abs(areaSelect.delta)),
						}}
					></div>
				</Portal>
			)}

			<AssetDropOverlay visible={fileDrop.isOver} onDrop={handleAssetDrop} />
		</>
	)
}
