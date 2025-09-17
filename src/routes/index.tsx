import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { mapValues, shuffle, sum } from "es-toolkit"
import { Fragment, useState } from "react"
import { twMerge } from "tailwind-merge"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import {
	buildDeck,
	type CardCounts,
	type CardInstance,
	listCards,
} from "../lib/cards.ts"
import { typed } from "../lib/helpers.ts"
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

	return (
		<div className="grid h-dvh place-items-center p-4">
			{view.type === "edit" ? (
				<DeckEditor
					onSubmit={(cardCounts) => {
						setView({ type: "play", cardCounts })
					}}
				/>
			) : (
				<PlayArea
					cardCounts={view.cardCounts}
					onEdit={() => setView({ type: "edit" })}
				/>
			)}
		</div>
	)
}

const DECK_SIZE = 20
const HAND_SIZE = 5

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

function PlayArea({
	cardCounts,
	onEdit,
}: {
	cardCounts: CardCounts
	onEdit: () => void
}) {
	const [state, setState] = useState(() => {
		const initialDeck = buildDeck(cardCounts)
		const shuffled = shuffle(initialDeck)
		return {
			deck: shuffled.slice(5),
			hand: shuffled.slice(0, 5),
			discard: typed<CardInstance[]>([]),
		}
	})

	function playCard(cardIndex: number) {
		setState((state) => {
			if (state.hand.length === 0) {
				console.warn("No cards in hand to play")
				return state
			}

			const card = state.hand[cardIndex]
			if (!card) {
				console.warn("Invalid card index", {
					cardIndex,
					hand: state.hand,
				})
				return state
			}

			return {
				...state,
				hand: state.hand.toSpliced(cardIndex, 1),
				discard: [card, ...state.discard],
			}
		})
	}

	function refreshHand() {
		setState((previousState) => {
			const state = { ...previousState }

			// discard entire hand
			state.discard = [...state.hand, ...state.discard]
			state.hand = []

			// if deck has less cards than hand size, reshuffle discard into deck
			if (state.deck.length < HAND_SIZE) {
				state.deck = shuffle([...state.deck, ...state.discard])
				state.discard = []
			}

			// draw new hand
			state.hand = state.deck.slice(0, HAND_SIZE)
			state.deck = state.deck.slice(HAND_SIZE)

			return state
		})
	}

	return (
		<div className="grid justify-items-center gap-2">
			<p className="flex items-center gap-1.5 font-semibold text-gray-400">
				<span>Cards in deck: {state.deck.length}</span>
				<span>&bull;</span>
				<span>Discard pile: {state.discard.length}</span>
			</p>
			<div className="flex h-52 panel overflow-visible p-2">
				{state.hand.length === 0 ? (
					<EmptyState
						icon="mingcute:pentagon-line"
						message="No cards in hand"
					/>
				) : (
					state.hand.map((card, index) => (
						<Fragment key={card.key}>
							<WithTooltip content={`Play ${card.name}`}>
								<button
									type="button"
									className="w-32 items-center drop-shadow-black/50 transition hover:-translate-y-1 hover:drop-shadow-lg focus-visible:-translate-y-1 focus-visible:drop-shadow-lg"
									onClick={() => {
										playCard(index)
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
			<div className="flex-center gap-2">
				<Button icon="mingcute:refresh-1-fill" onClick={refreshHand}>
					Refresh
				</Button>
				<Button icon="mingcute:edit-2-fill" onClick={onEdit}>
					Edit deck
				</Button>
			</div>
		</div>
	)
}
