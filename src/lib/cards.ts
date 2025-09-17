import { mapValues, range, startCase } from "es-toolkit"
import { typedEntries } from "./helpers.ts"
import type { Branded } from "./types.ts"

export type CardId = Branded<string, "CardId">

export interface Card {
	id: CardId
	name: string
	imageUrl: URL
}

const CARDS: Record<CardId, Card> = mapValues(
	{
		fire: {
			imageUrl: new URL("../assets/cards/fire.svg", import.meta.url),
		},
		water: {
			imageUrl: new URL("../assets/cards/water.svg", import.meta.url),
		},
		wind: {
			imageUrl: new URL("../assets/cards/wind.svg", import.meta.url),
		},
		light: {
			imageUrl: new URL("../assets/cards/light.svg", import.meta.url),
		},
		darkness: {
			imageUrl: new URL("../assets/cards/darkness.svg", import.meta.url),
		},
	},
	(props, id) => ({
		...props,
		id,
		name: startCase(id),
	}),
)

export function listCards(): Card[] {
	return Object.values(CARDS)
}

export function getCard(cardId: CardId): Card {
	return CARDS[cardId] as Card
}

export interface CardInstance extends Card {
	key: string
}

export type CardCounts = Record<CardId, number>

export function buildDeck(cardCounts: CardCounts): CardInstance[] {
	return typedEntries(cardCounts).flatMap(([cardId, count]) => {
		return range(count).map(() => ({
			...getCard(cardId),
			key: crypto.randomUUID(),
		}))
	})
}
