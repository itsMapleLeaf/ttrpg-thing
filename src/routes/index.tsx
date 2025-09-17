import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { mapValues, sum } from "es-toolkit"
import { Fragment, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { type Card, type CardCounts, listCards } from "../lib/cards.ts"
import { DECK_SIZE, Player } from "../lib/player.ts"
import type { NonEmptyArray } from "../lib/types.ts"
import { Button } from "../ui/Button.tsx"
import { EmptyState } from "../ui/EmptyState.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	const [view, setView] = useState<
		{ type: "edit" } | { type: "play"; cardCounts: CardCounts }
	>({ type: "edit" })

	return view.type === "edit" ? (
		<DeckEditor
			onSubmit={(cardCounts) => {
				setView({ type: "play", cardCounts })
			}}
		/>
	) : (
		<GameView
			cardCounts={view.cardCounts}
			onEdit={() => setView({ type: "edit" })}
		/>
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
		<form
			className="grid w-full max-w-xs gap-3 panel p-3"
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
	)
}

type Action = { type: "play"; cardIndex: number } | { type: "refresh" }

type HistoryEntry = {
	key: string
	state: Player.PlayerState
} & (
	| { type: "initial" }
	| { type: "play"; playedCard: Card; playedCardIndex: number }
	| { type: "refresh"; refreshedCount: number }
)

function GameView({
	cardCounts,
	onEdit,
}: {
	cardCounts: CardCounts
	onEdit: () => void
}) {
	const [items, setItems] = useState<NonEmptyArray<HistoryEntry>>(() => [
		{
			key: "initial",
			state: Player.newGame(cardCounts),
			type: "initial",
		},
	])
	const [offset, setOffset] = useState(0)
	const state = items[offset]?.state as Player.PlayerState

	const act = (action: Action) => {
		setItems((history) => {
			const currentEntry = history[offset] as HistoryEntry
			let newEntry: HistoryEntry

			if (action.type === "play") {
				const result = Player.play(currentEntry.state, action.cardIndex)
				if (!result.playedCard) {
					console.warn("Invalid play action", result)
					return history
				}

				newEntry = {
					key: crypto.randomUUID(),
					state: result.state,
					type: "play",
					playedCard: result.playedCard,
					playedCardIndex: action.cardIndex,
				}
			} else if (action.type === "refresh") {
				newEntry = {
					key: crypto.randomUUID(),
					state: Player.refresh(history[0].state),
					type: "refresh",
					refreshedCount: history[0].state.hand.length,
				}
			} else {
				throw new Error("Unknown action", { cause: action })
			}

			return [newEntry, ...history.slice(offset)]
		})
		setOffset(0)
	}

	const back = () => {
		setOffset((offset) => Math.min(offset + 1, items.length - 1))
	}

	const forward = () => {
		setOffset((offset) => Math.max(offset - 1, 0))
	}

	return (
		<div className="flex h-dvh w-full items-center gap-4 p-4">
			<HistoryPanel>
				{items.map((entry, index) => (
					<HistoryPanelItem
						key={entry.key}
						entry={entry}
						isCurrent={index === offset}
						onClick={() => setOffset(index)}
					/>
				))}
			</HistoryPanel>

			<div className="flex flex-1 flex-col items-center gap-2">
				<p className="flex items-center gap-1.5 font-semibold text-gray-400">
					<span>Cards in deck: {state.deck.length}</span>
					<span>&bull;</span>
					<span>Discard pile: {state.discard.length}</span>
				</p>

				<CardsPanel
					state={state}
					onPlayCard={(cardIndex) => act({ type: "play", cardIndex })}
				/>

				<div className="flex-center gap-2">
					<Button
						icon="mingcute:refresh-1-fill"
						onClick={() => act({ type: "refresh" })}
					>
						Refresh
					</Button>
					<Button icon="mingcute:back-2-fill" onClick={back}>
						Undo
					</Button>
					<Button icon="mingcute:forward-2-fill" onClick={forward}>
						Redo
					</Button>
					<Button icon="mingcute:edit-2-fill" onClick={onEdit}>
						Edit deck
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
	onPlayCard: (cardIndex: number) => void
}) {
	return (
		<div className="flex h-52 panel overflow-visible p-2">
			{state.hand.length === 0 ? (
				<EmptyState icon="mingcute:pentagon-line" message="No cards in hand" />
			) : (
				state.hand.map((card, index) => (
					<Fragment key={card.key}>
						<WithTooltip content={`Play ${card.name}`}>
							<button
								type="button"
								className="w-32 items-center drop-shadow-black/50 transition hover:-translate-y-1 hover:drop-shadow-lg focus-visible:-translate-y-1 focus-visible:drop-shadow-lg"
								onClick={() => {
									onPlayCard(index)
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
		<div className="flex h-full max-h-128 min-h-0 w-48 flex-col gap-2 panel p-2">
			<h2 className="px-2 text-lg font-light">Log</h2>
			<ul className="-mx-2 grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-2">
				{children}
			</ul>
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
					<>
						<div className="leading-snug">Played {entry.playedCard.name}</div>
						<div className="text-sm leading-tight font-medium opacity-75">
							Card {entry.playedCardIndex + 1}
						</div>
					</>
				) : (
					"Refreshed hand"
				)}
			</button>
		</li>
	)
}
