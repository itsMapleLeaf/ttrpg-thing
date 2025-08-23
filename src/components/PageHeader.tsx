import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useOptionalUser } from "../user-context"
import { UserMenu } from "./UserMenu.tsx"

export function PageHeader({
	heading,
	actions,
}: {
	heading: ReactNode
	actions?: ReactNode
}) {
	const user = useOptionalUser()
	return (
		<header className="flex items-center justify-between panel rounded-none border-0 border-b px-3 py-3">
			<div className="grid">
				<Link
					to="/"
					className="-mb-1.5 opacity-75 transition-opacity hover:opacity-100"
				>
					TTRPG Thing
				</Link>
				<h1 className="text-2xl">{heading}</h1>
			</div>
			<div className="flex items-center gap-2">
				{actions}
				{user && <UserMenu user={user} />}
			</div>
		</header>
	)
}
