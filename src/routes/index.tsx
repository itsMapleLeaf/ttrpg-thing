import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute } from "@tanstack/react-router"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api.js"
import { UserProvider, useUser } from "../user-context.tsx"

export const Route = createFileRoute("/")({
	component: Home,
})

function Home() {
	const auth = useConvexAuth()
	const user = useQuery(api.users.me)
	return (
		<main className="flex flex-col gap-16 p-8">
			{user ? (
				<UserProvider user={user}>
					<AuthenticatedMessage />
				</UserProvider>
			) : !auth.isAuthenticated && !auth.isLoading ? (
				<SignInMessage />
			) : (
				<p>Loading...</p>
			)}
		</main>
	)
}

function AuthenticatedMessage() {
	const user = useUser()
	const { signOut } = useAuthActions()
	return (
		<div>
			<p>{user.name ? `Welcome, ${user.name}!` : `Welcome!`}</p>
			<button type="button" onClick={() => signOut()}>
				Sign Out
			</button>
		</div>
	)
}

function SignInMessage() {
	const { signIn } = useAuthActions()
	return (
		<div>
			<p>You are not signed in.</p>
			<button type="button" onClick={() => signIn("discord")}>
				Sign In with Discord
			</button>
		</div>
	)
}
