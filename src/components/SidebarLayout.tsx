import { Dialog } from "@base-ui-components/react"
import { Link } from "@tanstack/react-router"
import { type ReactNode, Suspense } from "react"
import { Button } from "../ui/Button.tsx"
import { Icon } from "../ui/Icon.tsx"
import { Loading } from "../ui/Loading.tsx"
import { ScrollArea } from "../ui/ScrollArea.tsx"
import { useOptionalUser } from "../user-context.tsx"
import { LogoLink } from "./LogoLink.tsx"
import { RoomsSection } from "./SidebarRoomLinks.tsx"
import { UserMenu } from "./UserMenu.tsx"

export function SidebarLayout({
	sidebar,
	children,
}: {
	sidebar?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="flex min-h-dvh flex-col md:flex-row">
			<header className="flex items-center gap-3 border-b border-gray-700 bg-gray-800 px-3 py-2 md:hidden">
				<Dialog.Root>
					<Dialog.Trigger
						render={
							<Button
								icon="mingcute:menu-fill"
								appearance="clear"
								shape="square"
							>
								Menu
							</Button>
						}
					/>

					<Dialog.Portal>
						<Dialog.Backdrop className="fixed inset-0 bg-black/50 base-ui-fade-transition transition-all" />
						<Dialog.Popup className="pointer-events-children fixed inset-y-0 left-0 transition data-ending-style:-translate-x-4 data-ending-style:opacity-0 data-starting-style:-translate-x-4 data-starting-style:opacity-0">
							<Sidebar
								action={
									<Dialog.Close
										render={
											<Button
												icon="mingcute:close-fill"
												appearance="clear"
												shape="square"
											>
												Close menu
											</Button>
										}
									/>
								}
							>
								{sidebar}
							</Sidebar>
						</Dialog.Popup>
					</Dialog.Portal>
				</Dialog.Root>
				<LogoLink />
			</header>

			<div className="sticky top-0 hidden h-dvh self-stretch md:block">
				<Sidebar>{sidebar}</Sidebar>
			</div>

			<Suspense fallback={<Loading />}>
				<main className="grid flex-1">{children}</main>
			</Suspense>
		</div>
	)
}

function Sidebar({
	action,
	children,
}: {
	action?: ReactNode
	children: React.ReactNode
}) {
	const user = useOptionalUser()
	return (
		<nav className="relative flex h-full w-72 flex-col panel rounded-none border-0 border-r border-gray-700">
			<div className="flex items-center gap-3 border-b border-gray-700 px-3 py-2">
				{action}
				<LogoLink />
			</div>

			<div className="min-h-0 flex-1">{children}</div>

			<div className="grid border-t border-gray-700 p-1">
				{user && <UserMenu user={user} />}
			</div>
		</nav>
	)
}

export function CommonSidebarContent() {
	return (
		<ScrollArea className="h-full">
			<div className="grid content-start gap-2 p-2">
				<Link to="/" className="sidebar-link">
					<Icon icon="mingcute:add-fill" className="size-4" />
					<span>New room</span>
				</Link>
				<Link to="/sheet-builder" className="sidebar-link">
					<Icon icon="mingcute:tool-fill" className="size-4" />
					<span>Sheet builder</span>
				</Link>
				<RoomsSection />
			</div>
		</ScrollArea>
	)
}
