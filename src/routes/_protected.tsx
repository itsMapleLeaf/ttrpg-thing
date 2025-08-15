import { useAuthActions } from "@convex-dev/auth/react"
import { Icon } from "@iconify/react"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api.js"
import { UserProvider, useUser } from "../user-context.tsx"

export const Route = createFileRoute("/_protected")({
	component: Protected,
})

function Protected() {
	const auth = useConvexAuth()
	const user = useQuery(api.users.me)
	return (
		<div className="min-h-dvh">
			{user ? (
				<UserProvider user={user}>
					<div className="flex min-h-dvh flex-col">
						<SiteHeader />
						<main className="flex-1 bg-base-200">
							<Outlet />
						</main>
					</div>
				</UserProvider>
			) : !auth.isAuthenticated && !auth.isLoading ? (
				<div className="flex min-h-dvh items-center justify-center px-4 py-8">
					<div className="card w-full max-w-md border border-base-300 bg-base-100 shadow backdrop-blur card-md">
						<div className="card-body gap-6">
							<SignInMessage />
						</div>
					</div>
				</div>
			) : (
				<div className="flex min-h-dvh items-center justify-center">
					<div className="flex items-center gap-3" aria-live="polite">
						<span className="loading loading-sm loading-spinner" />
						<span className="text-sm opacity-70">Loading...</span>
					</div>
				</div>
			)}
		</div>
	)
}

function SiteHeader() {
	const { signOut } = useAuthActions()
	const user = useUser()

	return (
		<header className="border-b border-black/20 bg-base-300">
			<div className="container mx-auto px-6 py-4">
				<nav className="flex items-center justify-between">
					<Link
						to="/"
						className="text-xl font-light transition-opacity hover:opacity-80"
					>
						TTRPG Thing
					</Link>
					<div className="flex items-center gap-3">
						<span className="hidden text-sm sm:inline">
							<span className="opacity-70">signed in as</span>{" "}
							<strong className="font-semibold">
								{user.name || `user_${user._id}`}
							</strong>
						</span>
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={() => signOut()}
						>
							<Icon icon="mingcute:exit-fill" className="h-4 w-4" />
							<span className="hidden sm:inline">Sign out</span>
						</button>
					</div>
				</nav>
			</div>
		</header>
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
