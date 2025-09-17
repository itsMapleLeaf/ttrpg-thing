import { shuffle } from "es-toolkit"
import { buildDeck, type CardCounts, type CardInstance } from "./cards"

export * as Player from "./player.ts"

export const HAND_SIZE = 5
export const DECK_SIZE = 20

export interface PlayerState {
	deck: CardInstance[]
	hand: CardInstance[]
	discard: CardInstance[]
}

export function newGame(cardCounts: CardCounts): PlayerState {
	let state: PlayerState = {
		deck: shuffle(buildDeck(cardCounts)),
		hand: [],
		discard: [],
	}

	state = refresh(state)

	return state
}

export function play(
	state: PlayerState,
	cardIndex: number,
): {
	state: PlayerState
	playedCard?: CardInstance
	errors: string[]
} {
	if (state.hand.length === 0) {
		console.warn("No cards in hand to play")
		return { state, errors: ["No cards in hand to play"] }
	}

	const card = state.hand[cardIndex]
	if (!card) {
		console.warn("Invalid card index", { cardIndex, hand: state.hand })
		return { state, errors: ["Invalid card index"] }
	}

	return {
		state: {
			...state,
			hand: state.hand.filter((_, index) => index !== cardIndex),
			discard: [card, ...state.discard],
		},
		playedCard: card,
		errors: [],
	}
}

export function refresh(state: PlayerState): PlayerState {
	state = discardHand(state)

	if (state.deck.length < HAND_SIZE) {
		state = shuffleDiscardIntoDeck(state)
	}

	state = draw(state, HAND_SIZE)

	return state
}

export function draw(state: PlayerState, count: number): PlayerState {
	const drawCount = Math.min(count, state.deck.length)
	return {
		...state,
		hand: [...state.hand, ...state.deck.slice(0, drawCount)],
		deck: state.deck.slice(drawCount),
	}
}

export function discardHand(state: PlayerState): PlayerState {
	return {
		...state,
		hand: [],
		discard: [...state.discard, ...state.hand],
	}
}

export function shuffleDiscardIntoDeck(state: PlayerState): PlayerState {
	return {
		...state,
		deck: shuffle([...state.deck, ...state.discard]),
		discard: [],
	}
}
