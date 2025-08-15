import { Menu } from "@base-ui-components/react/menu"
import { useAuthActions } from "@convex-dev/auth/react"
import { Icon } from "@iconify/react"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { useConvexAuth, useQuery } from "convex/react"
import { Suspense } from "react"
import { api } from "../../convex/_generated/api.js"
import { Loading } from "../components/Loading.tsx"
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
							<Suspense fallback={<Loading />}>
								<Outlet />
							</Suspense>
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
				<Loading />
			)}
		</div>
	)
}

function SiteHeader() {
	const { signOut } = useAuthActions()

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
					<UserMenu onSignOut={signOut} />
				</nav>
			</div>
		</header>
	)
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
	const user = useUser()
	return (
		<Menu.Root>
			<Menu.Trigger className="btn relative btn-circle border border-black/20 btn-ghost btn-sm">
				<Icon icon="mingcute:user-3-fill" className="size-5" />
				{user.imageUrl && (
					<img
						src={user.imageUrl}
						alt=""
						className="absolute inset-0 size-full rounded-full object-cover opacity-0"
						ref={(element) => {
							if (!element) return

							if (element.complete) {
								element.classList.remove("opacity-0")
								return
							}

							const controller = new AbortController()

							element.addEventListener(
								"load",
								() => {
									element.classList.add("transition-opacity")
									element.classList.remove("opacity-0")
								},
								{ signal: controller.signal },
							)

							return () => {
								controller.abort()
							}
						}}
					/>
				)}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner>
					<Menu.Popup className="z-50 min-w-48 rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg">
						<Menu.Item
							className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-base-200"
							render={<Link to="/account" />}
						>
							<Icon icon="mingcute:settings-2-fill" className="btn-icon" />
							Account settings
						</Menu.Item>
						<Menu.Separator className="my-1 border-t border-base-300" />
						<Menu.Item
							className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-base-200"
							onClick={onSignOut}
						>
							<Icon icon="mingcute:exit-fill" className="btn-icon" />
							Sign out
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
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
