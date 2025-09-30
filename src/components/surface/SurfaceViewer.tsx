import { useEffect, useId, useRef, useState } from "react"
import { useWindowFileDrop } from "../../common/dom.ts"
import { useDrag } from "../../common/drag.ts"
import { useSelection } from "../../common/selection.ts"
import { vec } from "../../common/vec.ts"
import { Portal } from "../../ui/Portal.tsx"
import { useToastContext } from "../../ui/Toast.tsx"
import { AssetDropOverlay } from "./AssetDropOverlay.tsx"
import {
	ACCEPTED_FILE_TYPES,
	GRID_SNAP,
	SURFACE_HEIGHT,
	SURFACE_WIDTH,
} from "./constants.ts"
import { SurfaceTile, type TileInstance, useTiles } from "./tiles.tsx"
import { useViewport } from "./viewport.ts"

export function SurfaceViewer() {
	const { tiles, importAssetTiles, updateTile, removeTiles } = useTiles()
	const assetSelection = useSelection(tiles.map((a) => a.id))
	const assetTileListElementId = useId()
	const viewport = useViewport()
	const toast = useToastContext()
	const fileDrop = useWindowFileDrop()
	const [backgroundUrl, setBackgroundUrl] = useState<string>()

	// precompute asset rectangles once on drag start for performance
	const assetElementRects = useRef<{ id: string; rect: DOMRect }[]>([])

	const areaSelect = useDrag({
		buttons: ["left"],

		onStart() {
			assetElementRects.current = [
				...document.querySelectorAll(
					`#${assetTileListElementId} [data-asset-id]`,
				),
			].map((element) => ({
				id: (element as HTMLElement).dataset.assetId as string,
				rect: element.getBoundingClientRect(),
			}))
		},

		onMove(state) {
			const [start, end] = vec.corners(state.start, state.end)

			// find overlapping assets by checking element bounding boxes
			const overlappedAssetElements = assetElementRects.current.filter(
				({ rect }) =>
					vec.intersects(
						vec(rect.left, rect.top),
						vec(rect.right, rect.bottom),
						start,
						end,
					),
			)

			assetSelection.setSelectedItems(
				overlappedAssetElements.map((entry) => entry.id),
			)
		},
	})

	const [baseAssetDragDelta, setBaseAssetDragDelta] = useState(vec.zero)
	const assetDragDelta = vec.multiply(baseAssetDragDelta, 1 / viewport.scale)

	const assetDrag = useDrag({
		buttons: ["left"],
		onStart() {
			const now = Date.now()
			for (const [index, id] of [...assetSelection.items].entries()) {
				updateTile(id, (asset) => ({
					// Bring selected assets to front
					order: now + index,
					// Snap to grid on drag start, so the ending position is also on grid
					position: vec.roundTo(asset.position, GRID_SNAP),
				}))
			}
		},
		onMove(state) {
			setBaseAssetDragDelta(state.delta)
		},
		onEnd() {
			for (const id of assetSelection.items) {
				updateTile(id, (asset) => ({
					position: vec.clamp(
						vec.add(asset.position, assetDragDelta),
						vec.zero,
						vec.subtract(vec(SURFACE_WIDTH, SURFACE_HEIGHT), asset.size),
					),
				}))
			}
		},
	})

	const isDraggingAsset = (assetId: string) =>
		assetSelection.has(assetId) && assetDrag.isDragging

	const getRenderedAssetPosition = (asset: TileInstance) => {
		let position = vec.roundTo(asset.position, GRID_SNAP)
		if (isDraggingAsset(asset.id)) {
			position = vec.add(position, assetDragDelta)
		}
		return position
	}

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"keydown",
			(event) => {
				const inputHasFocus =
					document.activeElement?.tagName === "INPUT" ||
					document.activeElement?.tagName === "TEXTAREA" ||
					(document.activeElement as HTMLElement)?.isContentEditable
				if (inputHasFocus) return

				if (event.key === "Delete" || event.key === "Backspace") {
					if (assetSelection.items.size > 0) {
						event.preventDefault()
						removeTiles([...assetSelection.items])
						assetSelection.clear()
					}
				}
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}, [assetSelection, removeTiles])

	return (
		<>
			<div
				className="relative h-dvh touch-none"
				style={{
					backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
				onPointerDown={(event) => {
					if (event.button === 0 && !event.ctrlKey && !event.shiftKey) {
						assetSelection.clear()
					}
					areaSelect.handlePointerDown(event)
				}}
			>
				<div className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur" />
				<div
					className="relative size-full touch-none overflow-clip"
					onPointerDown={viewport.drag.handlePointerDown}
					ref={viewport.ref}
				>
					<div
						className="absolute inset-0 origin-top-left transition-transform duration-150 ease-out data-dragging:duration-75"
						data-dragging={viewport.drag.isDragging || undefined}
						style={{
							translate: vec.css.translate(
								vec.add(viewport.offset, viewport.drag.delta),
							),
							scale: viewport.scale,
						}}
					>
						<div
							id={assetTileListElementId}
							className="relative isolate size-full panel overflow-visible"
							style={{
								width: SURFACE_WIDTH,
								height: SURFACE_HEIGHT,
								// display a grid of dots
								// backgroundImage:
								// 	"radial-gradient(currentColor 1px, transparent 1px)",
								// backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`,
								// color: "rgba(255, 255, 255, 0.1)",

								backgroundImage: backgroundUrl
									? `url(${backgroundUrl})`
									: undefined,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						>
							<div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/40" />
							{tiles
								.sort((a, b) => a.order - b.order)
								.map((asset) => (
									<SurfaceTile
										key={asset.id}
										id={asset.id}
										imageUrl={
											asset.imageUrl
											// uncomment this when we're using remote URLs
											// getOptimizedImageUrl(
											// 	asset.url,
											// 	ceilToNearest(asset.size.x, 100),
											// ).href
										}
										position={getRenderedAssetPosition(asset)}
										size={asset.size}
										dragging={isDraggingAsset(asset.id)}
										selected={assetSelection.has(asset.id)}
										onPointerDown={(event) => {
											if (event.button === 0) {
												if (event.ctrlKey || event.shiftKey) {
													assetSelection.toggleItemSelected(asset.id)
												} else if (!assetSelection.has(asset.id)) {
													assetSelection.setSelectedItems([asset.id])
												}
											}
											assetDrag.handlePointerDown(event)
										}}
									/>
								))}
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

			<AssetDropOverlay
				visible={fileDrop.isOver}
				onDrop={(preset, files) => {
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
						importAssetTiles(
							files,
							vec
								.with(vec(window.innerWidth / 2, window.innerHeight / 2))
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
				}}
			/>
		</>
	)
}
