import { createContext, useContext } from "react"
import type { Doc } from "../convex/_generated/dataModel"

const UserContext = createContext<Doc<"users">>()

export function UserProvider({
	children,
	user,
}: {
	children: React.ReactNode
	user: Doc<"users">
}) {
	return <UserContext value={user}>{children}</UserContext>
}

export function useUser() {
	const user = useContext(UserContext)
	if (!user) {
		throw new Error("useUser must be used within a UserContext provider")
	}
	return user
}
