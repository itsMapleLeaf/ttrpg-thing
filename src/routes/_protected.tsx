import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Suspense } from "react"
import { PageHeader } from "../components/PageHeader.tsx"
import { Loading } from "../ui/Loading.tsx"
import { useOptionalUser } from "../user-context.tsx"

export const Route = createFileRoute("/_protected")({
	component: Protected,
})

function Protected() {
	const user = useOptionalUser()
	return (
		<div className="bg-base-300 min-h-dvh">
			{user ? (
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
			) : (
				<div className="flex min-h-dvh items-center justify-center px-4 py-8">
					<div className="card border-base-300 card-md w-full max-w-md border bg-gray-700 shadow backdrop-blur">
						<div className="card-body gap-6">
							<SignInMessage />
						</div>
					</div>
				</div>
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
					className="button button-primary w-full"
					onClick={() => signIn("discord")}
				>
					Sign in with Discord
				</button>
			</footer>
		</div>
	)
}
