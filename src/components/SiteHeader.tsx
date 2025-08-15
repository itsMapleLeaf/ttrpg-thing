import { useAuthActions } from "@convex-dev/auth/react"
import { Link } from "@tanstack/react-router"
import { UserMenu } from "./UserMenu.tsx"

export function SiteHeader() {
	const { signOut } = useAuthActions()

	return (
		<header className="border-b border-black/20 bg-base-300">
			<div className="container mx-auto px-6 py-2">
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
