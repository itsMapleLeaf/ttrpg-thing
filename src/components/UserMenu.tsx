import { useAuthActions } from "@convex-dev/auth/react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Link } from "@tanstack/react-router"
import type { ClientUser } from "../../convex/users.ts"
import { Menu, MenuButton, MenuItem, MenuPanel } from "./Menu.tsx"
import { SmartImage } from "./SmartImage.tsx"

export function UserMenu({ user }: { user: ClientUser }) {
	const { signOut } = useAuthActions()
	return (
		<Menu>
			<MenuButton className="button-clear h-[unset] px-3.5 py-2.5">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{user.name}</span>
					<div className="relative flex-center size-8 rounded-full outline-2 outline-black/25">
						{user.imageUrl ? (
							<SmartImage
								src={user.imageUrl}
								alt=""
								className="absolute inset-0 size-full rounded-full object-cover"
							/>
						) : (
							<Icon icon="mingcute:user-3-fill" className="size-5" />
						)}
					</div>
				</div>
			</MenuButton>

			<MenuPanel>
				<MenuItem
					icon="mingcute:settings-2-fill"
					render={<Link to="/account" />}
				>
					Account settings
				</MenuItem>
				<MenuItem icon="mingcute:exit-fill" onClick={signOut}>
					Sign out
				</MenuItem>
			</MenuPanel>
		</Menu>
	)
}
