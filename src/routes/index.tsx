import {
	type DragDropEvents,
	DragDropProvider,
	useDraggable,
	useDroppable,
} from "@dnd-kit/react"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { mapValues, sum } from "es-toolkit"
import { type ComponentProps, Fragment, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
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

	const fileDrop = useWindowFileDrop((event) => {
		createAssetsFromFiles(
			vec(event.clientX, event.clientY),
			event.dataTransfer?.files ?? [],
		)
	})

	const handleDragEnd: DragDropEvents["dragend"] = (event) => {
		if (event.canceled) return

		const { source, position } = event.operation
		if (source?.type === "asset") {
			const delta = vec.subtract(position.current, position.initial)
			updateAsset(String(source.id), (current) => ({
				position: vec.add(current.position, delta),
				order: Date.now(),
			}))
		}
	}

	return (
		<DragDropProvider onDragEnd={handleDragEnd}>
			<div className="relative isolate h-dvh overflow-clip">
				{assets
					.sort((a, b) => a.order - b.order)
					.map((asset) => (
						<AssetTile key={asset.id} asset={asset} />
					))}
			</div>
			<FileDropOverlay isOver={fileDrop.isOver} />
		</DragDropProvider>
	)
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

function AssetTile({ asset }: { asset: Asset }) {
	const draggable = useDraggable({
		id: asset.id,
		type: "asset",
		feedback: "move",
	})

	return (
		<div
			ref={draggable.ref}
			className="group absolute top-0 left-0 transition-transform ease-out"
			style={{
				translate: vec.css.translate(vec.roundTo(asset.position, GRID_SNAP)),
			}}
		>
			<div
				className="panel opacity-100 transition group-aria-pressed:opacity-50 group-aria-pressed:drop-shadow-lg"
				style={{
					background: `url(${asset.url}) center / cover`,
					...vec.asSize(asset.size),
				}}
			></div>
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
