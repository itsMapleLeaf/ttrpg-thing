import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router"
import { Suspense } from "react"
import { LogoLink } from "../components/LogoLink.tsx"
import { Button } from "../ui/Button.tsx"
import { Loading } from "../ui/Loading.tsx"
import { useOptionalUser } from "../user-context.tsx"

export const Route = createFileRoute("/_protected")({
	component: Protected,
})

function Protected() {
	const user = useOptionalUser()
	return user ? (
		<Suspense fallback={<Loading />}>
			<Outlet />
		</Suspense>
	) : (
		<div className="container mx-auto grid h-dvh max-w-2xl content-center p-6">
			<SignInMessage />
		</div>
	)
}

function SignInMessage() {
	const { signIn } = useAuthActions()
	const location = useLocation()

	return (
		<div className="grid content-center justify-center gap-4 text-center">
			<header>
				<LogoLink />
			</header>
			<main className="grid content-center justify-center gap-4 panel p-4 text-center">
				<h1 className="text-xl font-semibold">Sign in to continue</h1>
				<Button
					icon="simple-icons:discord"
					appearance="solid"
					onClick={() => signIn("discord", { redirectTo: location.href })}
				>
					Sign in with Discord
				</Button>
			</main>
		</div>
	)
}
