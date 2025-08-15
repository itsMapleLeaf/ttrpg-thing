import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { UserMenu } from "./UserMenu.tsx"

export function PageHeader({
	heading,
	actions,
}: {
	heading: ReactNode
	actions?: ReactNode
}) {
	return (
		<header className="border-b border-base-100 bg-base-200">
			<nav className="container flex items-center justify-between py-3">
				<div className="grid">
					<Link
						to="/"
						className="-mb-1.5 opacity-75 transition-opacity hover:opacity-100"
					>
						TTRPG Thing
					</Link>
					<h1 className="text-2xl">{heading}</h1>
				</div>
				<div className="flex items-center gap-6">
					{actions}
					<UserMenu />
				</div>
			</nav>
		</header>
	)
}
