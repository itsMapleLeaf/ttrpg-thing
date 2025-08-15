import { createContext, useContext } from "react"
import type { ClientUser } from "../convex/users.ts"

const UserContext = createContext<ClientUser>()

export function UserProvider({
	children,
	user,
}: {
	children: React.ReactNode
	user: ClientUser
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
