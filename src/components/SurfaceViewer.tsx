import { Dialog } from "@base-ui-components/react"
import { type } from "arktype"
import { clamp } from "es-toolkit"
import { useId, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useDrag } from "../hooks/useDrag.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useSelection } from "../hooks/useSelection.ts"
import { useWindowFileDrop } from "../hooks/useWindowFileDrop.tsx"
import { useWindowSize } from "../hooks/useWindowSize.ts"
import { type Vec, vec } from "../lib/vec.ts"
import { Button } from "../ui/Button.tsx"
import { Portal } from "../ui/Portal.tsx"
import { useToastContext } from "../ui/Toast.tsx"

const SURFACE_WIDTH = 1600 * 4
const SURFACE_HEIGHT = 900 * 4
const SURFACE_SIZE = vec(SURFACE_WIDTH, SURFACE_HEIGHT)
const GRID_SNAP = 20

export function SurfaceViewer() {
	const { assets, importAssets, updateAsset } = useTiles()
	const assetSelection = useSelection(assets.map((a) => a.id))
	const assetTileListElementId = useId()
	const viewport = useViewport()
	const toast = useToastContext()
	const [windowWidth, windowHeight] = useWindowSize()

	const importDialog = useImportDialog((preset, files) => {
		importAssets(
			files,
			vec
				.with(vec(windowWidth / 2, windowHeight / 2))
				.subtract(viewport.offset)
				.multiply(1 / viewport.scale)
				.result(),
			preset.size,
		)
	})

	const fileDrop = useWindowFileDrop((event) => {
		const imageFiles = []
		for (const item of event.dataTransfer?.items ?? []) {
			const file = item.getAsFile()
			if (!file) continue

			if (!ACCEPTED_FILE_TYPES.has(item.type)) {
				toast.error(`Unsupported file type: ${item.type}`)
				continue
			}

			imageFiles.push(file)
		}

		if (imageFiles.length === 0) return

		importDialog.show(imageFiles)
	})

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
				updateAsset(id, (asset) => ({
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
				updateAsset(id, (asset) => ({
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

	const getRenderedAssetPosition = (asset: TileDoc) => {
		let position = vec.roundTo(asset.position, GRID_SNAP)
		if (isDraggingAsset(asset.id)) {
			position = vec.add(position, assetDragDelta)
		}
		return position
	}

	return (
		<>
			<div
				className="h-dvh touch-none"
				onPointerDown={(event) => {
					if (event.button === 0 && !event.ctrlKey && !event.shiftKey) {
						assetSelection.clear()
					}
					areaSelect.handlePointerDown(event)
				}}
			>
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
								backgroundImage:
									"radial-gradient(currentColor 1px, transparent 1px)",
								backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`,
								color: "rgba(255, 255, 255, 0.1)",
							}}
						>
							{assets
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

			{fileDrop.overlayElement}
			{importDialog.element}
		</>
	)
}

type AssetImportPreset = (typeof IMPORT_PRESETS)[number]
const IMPORT_PRESETS = [
	{ name: "Tile", size: vec(100, 100) },
	{ name: "Map", size: vec(1000, 1000) },
	{ name: "Portrait", size: vec(400, 600) },
	{ name: "Scene", size: vec(1600, 900) },
]

function useImportDialog(
	onSubmit: (preset: AssetImportPreset, files: File[]) => void,
) {
	const [visible, setVisible] = useState(false)
	const [files, setFiles] = useState<File[]>([])

	const element = (
		<Dialog.Root open={visible}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 transition data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<Dialog.Popup className="fixed inset-0 flex-center flex-col gap-8 overflow-y-auto text-center">
					<Dialog.Title className="text-2xl font-light">
						Choose a preset
					</Dialog.Title>

					<div className="flex flex-wrap items-center gap-8">
						{/* <button type="button" className="flex flex-col gap-2">
							<div className="aspect-[1/1] panel">
								<p>100x100</p>
							</div>
							<p>Tile</p>
						</button> */}

						{IMPORT_PRESETS.map((preset) => (
							<button
								key={preset.name}
								type="button"
								className="flex flex-col gap-2 rounded p-2 opacity-75 transition hover:bg-white/10 hover:opacity-100"
								onClick={() => {
									onSubmit(preset, files)
									setVisible(false)
								}}
							>
								<div className="flex-center size-48">
									<div
										className={twMerge(
											"flex-center panel text-gray-500",
											preset.size.x > preset.size.y ? "w-full" : "h-full",
										)}
										style={{
											aspectRatio: `${preset.size.x}/${preset.size.y}`,
										}}
									>
										{preset.size.x}x{preset.size.y}
									</div>
								</div>
								<p>{preset.name}</p>
							</button>
						))}
					</div>

					<Button icon="mingcute:close-fill" onClick={() => setVisible(false)}>
						Cancel
					</Button>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	)

	return {
		element,
		show: (files: File[]) => {
			setFiles(files)
			setVisible(true)
		},
	}
}

function SurfaceTile({
	id,
	position,
	size,
	imageUrl,
	selected,
	dragging,
	onPointerDown,
}: {
	id: string
	position: Vec
	size: Vec
	imageUrl: string
	selected: boolean
	dragging: boolean
	onPointerDown: (event: React.PointerEvent) => void
}) {
	return (
		<div
			style={{ translate: vec.css.translate(position) }}
			data-asset-id={id}
			data-dragging={dragging}
			className="absolute top-0 left-0 transition-transform duration-100 ease-out data-[dragging=true]:duration-25"
			onPointerDown={onPointerDown}
		>
			<div className="relative">
				<div
					className="panel rounded opacity-100 shadow-black/50 transition data-[dragging=true]:opacity-75 data-[dragging=true]:shadow-lg"
					data-dragging={dragging}
					style={{
						background: `url(${imageUrl}) center / cover`,
						...vec.asSize(size),
					}}
				></div>
				<div
					className="absolute -inset-1 rounded-md border border-primary-400 bg-primary-500/20 opacity-0 transition data-[visible=true]:opacity-100"
					data-visible={selected}
				></div>
			</div>
		</div>
	)
}

const MAX_ZOOM_TICK = 10
const MIN_ZOOM_TICK = -10
const ZOOM_COEFFICIENT = 1.2

function useViewport() {
	const [windowWidth, windowHeight] = useWindowSize()

	function clampToWindow(offset: Vec, scale: number): Vec {
		// clamp such that the corners don't go beyond the center of the window
		return vec.clamp(
			offset,
			vec(
				-SURFACE_WIDTH * scale + windowWidth / 2,
				-SURFACE_HEIGHT * scale + windowHeight / 2,
			),
			vec(windowWidth / 2, windowHeight / 2),
		)
	}

	const [viewport, setViewport] = useLocalStorage({
		key: "viewport",
		schema: type({
			offset: { x: "number", y: "number" },
			zoom: "number",
		}),
		fallback: {
			offset: vec.subtract(
				vec(windowWidth / 2, windowHeight / 2),
				vec(SURFACE_WIDTH / 2, SURFACE_HEIGHT / 2),
			),
			zoom: 0,
		},
	})

	const drag = useDrag({
		buttons: ["middle", "right"],
		onEnd(state) {
			setViewport((viewport) => ({
				...viewport,
				offset: clampToWindow(
					vec.add(viewport.offset, state.delta),
					ZOOM_COEFFICIENT ** viewport.zoom,
				),
			}))
		},
	})

	function ref(element: HTMLDivElement | null) {
		if (!element) return

		const controller = new AbortController()

		// use a direct event listener instead of onWheel so we can call preventDefault
		window.addEventListener(
			"wheel",
			(event) => {
				event.preventDefault()

				const delta = -Math.sign(event.deltaY)
				if (delta === 0) return

				setViewport((viewport) => {
					const newZoomTick = clamp(
						viewport.zoom + delta,
						MIN_ZOOM_TICK,
						MAX_ZOOM_TICK,
					)

					// Adjust offset so that the point under the cursor stays in the same place
					const currentScale = ZOOM_COEFFICIENT ** viewport.zoom
					const newScale = ZOOM_COEFFICIENT ** newZoomTick
					const zoomFactor = newScale / currentScale
					const cursorPosition = vec(event.clientX, event.clientY)

					return {
						zoom: newZoomTick,
						offset: clampToWindow(
							vec
								.with(viewport.offset)
								.subtract(cursorPosition)
								.multiply(zoomFactor)
								.add(cursorPosition)
								.result(),
							newScale,
						),
					}
				})
			},
			{ passive: false, signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}

	return {
		scale: ZOOM_COEFFICIENT ** viewport.zoom,
		offset: clampToWindow(viewport.offset, ZOOM_COEFFICIENT ** viewport.zoom),
		drag,
		ref,
	}
}

const ACCEPTED_FILE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
])

type TileDoc = {
	id: string
	position: Vec
	size: Vec
	order: number
	imageUrl: string
}

function useTiles() {
	const toast = useToastContext()

	const [assets, setAssets] = useState<TileDoc[]>([])

	const importAssets = (files: File[], basePosition: Vec, size: Vec) => {
		const now = Date.now()

		for (const [index, file] of files.entries()) {
			try {
				const id = crypto.randomUUID()
				const url = URL.createObjectURL(file)
				// const bitmap = await createImageBitmap(file)

				const position = vec
					.with(basePosition)
					.subtract(vec.divide(size, 2))
					.add(index * GRID_SNAP)
					.clamp(vec.zero, vec.subtract(SURFACE_SIZE, size))
					.result()

				setAssets((assets) => [
					...assets,
					{
						id,
						imageUrl: url,
						position,
						size,
						order: now + index,
					},
				])
			} catch (error) {
				toast.error(`Failed to load image: ${(error as Error).message}`)
			}
		}
	}

	const updateAsset = (
		id: string,
		update: (current: TileDoc) => Partial<TileDoc>,
	) => {
		setAssets((assets) =>
			assets.map((asset) => {
				if (asset.id !== id) return asset
				return { ...asset, ...update(asset) }
			}),
		)
	}

	return { assets, importAssets, updateAsset }
}
