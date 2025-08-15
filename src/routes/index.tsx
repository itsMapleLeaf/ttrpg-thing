import { useAuthActions } from "@convex-dev/auth/react"
import { Icon } from "@iconify/react"
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
		<div className="flex min-h-dvh items-center justify-center bg-base-200 px-4 py-8">
			<div className="card w-full max-w-md border border-base-300 bg-base-100 shadow backdrop-blur card-md">
				<div className="card-body gap-6">
					{user ? (
						<UserProvider user={user}>
							<AuthenticatedMessage />
						</UserProvider>
					) : !auth.isAuthenticated && !auth.isLoading ? (
						<SignInMessage />
					) : (
						<div className="flex items-center gap-3" aria-live="polite">
							<span className="loading loading-sm loading-spinner" />
							<span className="text-sm opacity-70">Loading...</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function AuthenticatedMessage() {
	const user = useUser()
	const { signOut } = useAuthActions()
	return (
		<div className="flex flex-col gap-4">
			<header className="space-y-1">
				<h1 className="text-xl font-semibold">
					{user.name ? `Welcome, ${user.name}!` : `Welcome!`}
				</h1>
				<p className="text-sm opacity-70">You're signed in.</p>
			</header>
			<footer className="card-actions justify-end">
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => signOut()}
				>
					<Icon icon="mingcute:exit-fill" className="btn-icon" /> Sign out
				</button>
			</footer>
		</div>
	)
}

function SignInMessage() {
	const { signIn } = useAuthActions()
	return (
		<div className="flex flex-col gap-6">
			<header className="space-y-1">
				<h1 className="text-xl font-semibold">Sign in to continue</h1>
			</header>
			<footer className="card-actions justify-end">
				<button
					type="button"
					className="btn w-full btn-primary"
					onClick={() => signIn("discord")}
				>
					Sign in with Discord
				</button>
			</footer>
		</div>
	)
}
