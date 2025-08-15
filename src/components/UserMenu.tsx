import { Menu } from "@base-ui-components/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Link } from "@tanstack/react-router"
import { useUser } from "../user-context.tsx"

export function UserMenu() {
	const user = useUser()
	const { signOut } = useAuthActions()
	return (
		<Menu.Root>
			<Menu.Trigger className="relative -mx-2 flex items-center gap-2 rounded p-2 opacity-75 transition-opacity hover:opacity-100">
				<span className="text-sm font-semibold">{user.name}</span>
				<div className="relative size-8 rounded-full border border-black/20">
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
				</div>
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
							onClick={signOut}
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
