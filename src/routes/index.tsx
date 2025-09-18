import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { clamp, mapValues, sum } from "es-toolkit"
import { Fragment, useEffect, useId, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useDrag } from "../hooks/useDrag.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useSelection } from "../hooks/useSelection.ts"
import { useWindowFileDrop } from "../hooks/useWindowFileDrop.ts"
import {
	type Card,
	type CardCounts,
	type CardInstance,
	getCardOrder,
	listCards,
} from "../lib/cards.ts"
import { DECK_SIZE, Player } from "../lib/player.ts"
import type { NonEmptyArray } from "../lib/types.ts"
import { type Vec, vec } from "../lib/vec.ts"
import { Button } from "../ui/Button.tsx"
import { EmptyState } from "../ui/EmptyState.tsx"
import { Icon } from "../ui/Icon.tsx"
import { Portal } from "../ui/Portal.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

const SURFACE_WIDTH = 1600 * 4
const SURFACE_HEIGHT = 900 * 4
const SURFACE_SIZE = vec(SURFACE_WIDTH, SURFACE_HEIGHT)
const GRID_SNAP = 20

type Asset = {
	id: string
	url: string
	position: Vec
	size: Vec
	order: number
}

function RouteComponent() {
	const { assets, createAssetsFromFiles, updateAsset } = useAssets()
	const assetSelection = useSelection(assets.map((a) => a.id))
	const assetTileListElementId = useId()
	const viewport = useViewport()

	const fileDrop = useWindowFileDrop((event) => {
		createAssetsFromFiles(
			vec
				.with(event.clientX, event.clientY)
				.subtract(viewport.offset)
				.divide(viewport.scale)
				.result(),
			event.dataTransfer?.files ?? [],
		)
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

	const getRenderedAssetPosition = (asset: Asset) => {
		let position = vec.roundTo(asset.position, GRID_SNAP)
		if (isDraggingAsset(asset.id)) {
			position = vec.add(position, assetDragDelta)
		}
		return position
	}

	return (
		<>
			<div className="h-dvh" onPointerDown={areaSelect.handlePointerDown}>
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
							style={{ width: SURFACE_WIDTH, height: SURFACE_HEIGHT }}
							onPointerDown={(event) => {
								if (
									event.button === 0 &&
									event.target === event.currentTarget &&
									!event.ctrlKey &&
									!event.shiftKey
								) {
									assetSelection.clear()
								}
							}}
						>
							{assets
								.sort((a, b) => a.order - b.order)
								.map((asset) => (
									<AssetTile
										key={asset.id}
										id={asset.id}
										url={
											asset.url
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

			<FileDropOverlay isOver={fileDrop.isOver} />
		</>
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

function useAssets() {
	const toast = useToastContext()

	const [assets, setAssets] = useState<Asset[]>([])

	const createAssetsFromFiles = (basePosition: Vec, files: Iterable<File>) => {
		const now = Date.now()
		for (const [index, file] of [...files].entries()) {
			try {
				const id = crypto.randomUUID()
				const url = URL.createObjectURL(file)
				// const bitmap = await createImageBitmap(file)
				const size = vec(500)

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
						url,
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
		update: (current: Asset) => Partial<Asset>,
	) => {
		setAssets((assets) =>
			assets.map((asset) => {
				if (asset.id !== id) return asset
				return { ...asset, ...update(asset) }
			}),
		)
	}

	return { assets, createAssetsFromFiles, updateAsset }
}

function AssetTile({
	id,
	position,
	size,
	url,
	selected,
	dragging,
	onPointerDown,
}: {
	id: string
	position: Vec
	size: Vec
	url: string
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
						background: `url(${url}) center / cover`,
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

function FileDropOverlay({ isOver }: { isOver: boolean }) {
	return (
		<Portal>
			<div
				className="pointer-events-none invisible fixed inset-0 flex-center bg-black/50 opacity-0 backdrop-blur transition-all transition-discrete data-[visible=true]:visible data-[visible=true]:opacity-100"
				data-visible={isOver}
			>
				<p className="text-3xl font-light">Drop files to import assets</p>
			</div>
		</Portal>
	)
}

function DeckEditor({
	onSubmit,
}: {
	onSubmit: (cardCounts: CardCounts) => void
}) {
	const [cardCounts, setCardCounts] = useLocalStorage<CardCounts>({
		key: "DeckEditor:cardCounts",
		fallback: mapValues(
			listCards().map((card) => card.id),
			() => 1,
		),
		schema: type(`Record<string, number>`),
	})

	function setCardCountOf(cardId: string, value: number) {
		setCardCounts((counts) => ({
			...counts,
			[cardId]: value,
		}))
	}

	function getTotalDisplayClass() {
		const total = sum(Object.values(cardCounts))
		if (total < DECK_SIZE) {
			return twMerge("text-yellow-300")
		}
		if (total > DECK_SIZE) {
			return twMerge("text-red-300")
		}
		return twMerge("text-emerald-300")
	}

	return (
		<div className="flex h-dvh flex-col">
			<form
				className="m-auto grid w-full max-w-xs gap-3 panel p-3"
				action={() => {
					onSubmit(cardCounts)
				}}
			>
				{listCards().map((card) => (
					<div key={card.id} className="grid">
						<label htmlFor="" className="text-sm font-medium">
							{card.name}
						</label>
						<input
							type="number"
							className="input"
							value={cardCounts[card.id]}
							min={1}
							onChange={(event) => {
								setCardCountOf(card.id, event.currentTarget.valueAsNumber)
							}}
						/>
					</div>
				))}
				<p className={getTotalDisplayClass()}>
					Total: <strong>{sum(Object.values(cardCounts))} / 20</strong>
				</p>
				<Button type="submit" icon="mingcute:play-fill" appearance="solid">
					Play
				</Button>
			</form>
		</div>
	)
}

type Action = { type: "play"; cardKey: string } | { type: "refresh" }

type HistoryEntry = {
	key: string
	state: Player.PlayerState
} & (
	| { type: "initial" }
	| { type: "play"; playedCard: Card }
	| { type: "refresh"; refreshedCount: number }
)

function GameView({
	cardCounts,
	onEdit,
}: {
	cardCounts: CardCounts
	onEdit: () => void
}) {
	const [historyItems, setHistoryItems] = useState<NonEmptyArray<HistoryEntry>>(
		() => [
			{
				key: "initial",
				state: Player.newGame(cardCounts),
				type: "initial",
			},
		],
	)
	const [historyOffset, setHistoryOffset] = useState(0)
	const state = historyItems[historyOffset]?.state as Player.PlayerState

	const act = (action: Action) => {
		setHistoryItems((history) => {
			const currentEntry = history[historyOffset] as HistoryEntry
			let newEntry: HistoryEntry

			if (action.type === "play") {
				const result = Player.play(currentEntry.state, action.cardKey)
				if (!result.playedCard) {
					console.warn("Invalid play action", result)
					return history
				}

				newEntry = {
					key: crypto.randomUUID(),
					state: result.state,
					type: "play",
					playedCard: result.playedCard,
				}
			} else if (action.type === "refresh") {
				newEntry = {
					key: crypto.randomUUID(),
					state: Player.refresh(currentEntry.state),
					type: "refresh",
					refreshedCount: currentEntry.state.hand.length,
				}
			} else {
				throw new Error("Unknown action", { cause: action })
			}

			return [newEntry, ...history.slice(historyOffset)]
		})
		setHistoryOffset(0)
	}

	const back = () => {
		setHistoryOffset((offset) => Math.min(offset + 1, historyItems.length - 1))
	}

	const forward = () => {
		setHistoryOffset((offset) => Math.max(offset - 1, 0))
	}

	return (
		<div className="flex h-dvh w-full items-center gap-4 p-4">
			<HistoryPanel>
				{historyItems.slice(0, 100).map((entry, index) => (
					<HistoryPanelItem
						key={entry.key}
						entry={entry}
						isCurrent={index === historyOffset}
						onClick={() => setHistoryOffset(index)}
					/>
				))}
			</HistoryPanel>

			<div className="flex flex-1 flex-col items-center gap-3">
				<div className="flex items-center gap-4 p-1">
					<WithTooltip content={`${state.deck.length} cards in deck`}>
						<p className="flex cursor-default items-center gap-1.5 font-semibold text-gray-400 select-none">
							<Icon icon="streamline:cards-solid" className="size-5" />
							<span>{state.deck.length}</span>
						</p>
					</WithTooltip>
					<WithTooltip
						content={`${state.discard.length} cards in discard pile`}
					>
						<p className="flex cursor-default items-center gap-1.5 font-semibold text-gray-400 select-none">
							<Icon icon="streamline:cards" className="size-5" />
							<span>{state.discard.length}</span>
						</p>
					</WithTooltip>
				</div>

				<CardsPanel
					state={state}
					onPlayCard={(cardKey) => act({ type: "play", cardKey })}
				/>

				<div className="flex-center gap-2">
					<Button icon="mdi:cards" onClick={() => act({ type: "refresh" })}>
						New Hand
					</Button>
					<Button icon="mingcute:back-2-fill" onClick={back}>
						Undo
					</Button>
					<Button icon="mingcute:forward-2-fill" onClick={forward}>
						Redo
					</Button>
					<Button icon="mingcute:edit-2-fill" onClick={onEdit}>
						Edit Deck
					</Button>
				</div>
			</div>
		</div>
	)
}

function CardsPanel({
	state,
	onPlayCard,
}: {
	state: Player.PlayerState
	onPlayCard: (key: CardInstance["key"]) => void
}) {
	return (
		<div className="flex h-52 panel overflow-visible p-2">
			{state.hand.length === 0 ? (
				<EmptyState icon="mingcute:pentagon-line" message="No cards in hand" />
			) : (
				state.hand
					.sort((a, b) => getCardOrder(a) - getCardOrder(b))
					.map((card) => (
						<Fragment key={card.key}>
							<WithTooltip content={`Play ${card.name}`}>
								<button
									type="button"
									className="w-32 items-center drop-shadow-black/50 transition hover:-translate-y-1 hover:drop-shadow-lg focus-visible:-translate-y-1 focus-visible:drop-shadow-lg"
									onClick={() => {
										onPlayCard(card.key)
									}}
								>
									<img
										src={card.imageUrl.href}
										alt={card.id}
										className="size-full"
									/>
								</button>
							</WithTooltip>
						</Fragment>
					))
			)}
		</div>
	)
}

function HistoryPanel({ children }: { children: React.ReactNode }) {
	return (
		<div className="w-48 panel">
			<section className="isolate grid h-full max-h-128 min-h-0 overflow-y-auto">
				<h2 className="sticky top-0 z-10 bg-gray-800 px-4 pt-2.5 pb-1.5 text-lg font-light">
					Log
				</h2>
				<ul className="grid min-h-0 flex-1 content-start gap-1 p-2">
					{children}
				</ul>
			</section>
		</div>
	)
}

function HistoryPanelItem({
	entry,
	isCurrent,
	onClick,
}: {
	entry: HistoryEntry
	isCurrent: boolean
	onClick: () => void
}) {
	return (
		<li>
			<button
				type="button"
				className={twMerge(
					"block w-full rounded px-2 py-1 text-left transition",
					isCurrent
						? "rounded bg-gray-700 font-medium text-primary-300"
						: "opacity-75 hover:bg-gray-700 hover:opacity-100",
				)}
				onClick={onClick}
			>
				{entry.type === "play" ? (
					<>Played {entry.playedCard.name}</>
				) : (
					"Refreshed hand"
				)}
			</button>
		</li>
	)
}

function useWindowSize(): readonly [number, number] {
	const [width, setWidth] = useState(window.innerWidth)
	const [height, setHeight] = useState(window.innerHeight)

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"resize",
			() => {
				setWidth(window.innerWidth)
				setHeight(window.innerHeight)
			},
			{ signal: controller.signal },
		)

		return () => {
			controller.abort()
		}
	}, [])

	return [width, height] as const
}
