import { createContext, use } from "react"
import type { ClientRoom } from "../../../../convex/rooms.ts"

export const RoomProvider = createContext<ClientRoom | null>(null)

export function useRoomContext() {
	const room = use(RoomProvider)
	if (!room) {
		throw new Error("useRoom must be used within a RoomProvider")
	}
	return room
}
