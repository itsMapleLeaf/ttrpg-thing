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
	cardKey: string,
): {
	state: PlayerState
	playedCard?: CardInstance
	errors: string[]
} {
	if (state.hand.length === 0) {
		console.warn("No cards in hand to play")
		return { state, errors: ["No cards in hand to play"] }
	}

	const card = state.hand.find((c) => c.key === cardKey)
	if (!card) {
		console.warn("Invalid card index", { cardIndex: cardKey, hand: state.hand })
		return { state, errors: ["Invalid card index"] }
	}

	state = {
		...state,
		hand: state.hand.filter((c) => c.key !== cardKey),
		discard: [card, ...state.discard],
	}

	// when playing the last card, draw a new hand
	if (state.hand.length === 0) {
		state = refresh(state)
	}

	return {
		state,
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
