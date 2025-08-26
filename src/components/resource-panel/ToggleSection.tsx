import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import type { ReactNode } from "react"
import { useLocalStorage } from "../../hooks/useLocalStorage.ts"
import type { Falsy } from "../../lib/types.ts"
import { Button } from "../../ui/Button.tsx"
import { Iconish, type IconishIcon } from "../../ui/Iconish.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../../ui/Menu.tsx"

type ToggleSectionAction = {
	name: string
	icon: IconishIcon
} & (
	| {
			callback: () => unknown
	  }
	| {
			options: {
				name: string
				icon: IconishIcon
				callback: () => unknown
			}[]
	  }
)

type ToggleSectionProps = {
	name: string
	subtext?: ReactNode
	children: ReactNode
	actions?: (ToggleSectionAction | Falsy)[]
}

export function ToggleSection({
	name,
	subtext,
	children,
	actions,
}: ToggleSectionProps) {
	const [isCollapsed, setIsCollapsed] = useLocalStorage({
		key: `AssetListToggleSection:${name}:collapsed`,
		fallback: false,
		schema: type("boolean"),
	})

	return (
		<div className="isolate">
			<div className="sticky top-0 z-10 flex items-center">
				<button
					type="button"
					className="flex w-full items-center gap-2 bg-gray-900/75 p-3 text-left backdrop-blur transition-colors hover:bg-gray-800/75"
					onClick={() => {
						setIsCollapsed((prev) => !prev)
					}}
				>
					<Icon
						icon="mingcute:down-fill"
						data-collapsed={isCollapsed || undefined}
						className="size-4 opacity-70 transition-transform data-collapsed:-rotate-90"
					/>
					<div className="flex-1">
						<span className="text-sm font-medium">{name}</span>
						{subtext && (
							<span className="ml-2 text-xs opacity-50">{subtext}</span>
						)}
					</div>
				</button>

				{actions && actions.length > 0 && (
					<div className="absolute right-0 z-20 flex gap-1 px-1.5 *:size-8">
						{actions.filter(Boolean).map((action) =>
							"callback" in action ? (
								<Button
									key={action.name}
									icon={<Iconish icon={action.icon} className="size-4" />}
									shape="square"
									onClick={action.callback}
								>
									{action.name}
								</Button>
							) : (
								<Menu key={action.name}>
									<MenuButton
										render={
											<Button
												icon={<Iconish icon={action.icon} className="size-4" />}
												shape="square"
											>
												{action.name}
											</Button>
										}
									/>
									<MenuPanel>
										{action.options.map((option) => (
											<MenuItem
												key={option.name}
												icon={<Iconish icon={option.icon} className="size-4" />}
												onClick={option.callback}
											>
												{option.name}
											</MenuItem>
										))}
									</MenuPanel>
								</Menu>
							),
						)}
					</div>
				)}
			</div>
			{!isCollapsed && children}
		</div>
	)
}
