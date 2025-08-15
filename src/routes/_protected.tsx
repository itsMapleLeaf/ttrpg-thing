import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useConvexAuth, useQuery } from "convex/react"
import { Suspense } from "react"
import { api } from "../../convex/_generated/api.js"
import { Loading } from "../components/Loading.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { UserProvider } from "../user-context.tsx"

export const Route = createFileRoute("/_protected")({
	component: Protected,
})

function Protected() {
	const auth = useConvexAuth()
	const user = useQuery(api.users.me)
	return (
		<div className="min-h-dvh bg-base-300">
			{user ? (
				<UserProvider user={user}>
					<Suspense
						fallback={
							<>
								<PageHeader heading="Loading..." />
								<Loading />
							</>
						}
					>
						<Outlet />
					</Suspense>
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
				<Loading />
			)}
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
