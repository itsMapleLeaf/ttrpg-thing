import { useConvexAuth, useQuery } from "convex/react"
import { createContext, useContext } from "react"
import { api } from "../convex/_generated/api.js"
import type { ClientUser } from "../convex/users.ts"
import { Loading } from "./ui/Loading.tsx"

const UserContext = createContext<ClientUser | null | undefined>()

export function UserProvider({ children }: { children: React.ReactNode }) {
	const user = useQuery(api.users.me)
	const auth = useConvexAuth()
	return (
		<div className="bg-base-300 min-h-dvh">
			{auth.isLoading ? (
				<Loading />
			) : (
				<UserContext value={user}>{children}</UserContext>
			)}
		</div>
	)
}

export function useOptionalUser() {
	return useContext(UserContext)
}

export function useUser() {
	const user = useContext(UserContext)
	if (!user) {
		throw new Error("Not logged in")
	}
	return user
}
