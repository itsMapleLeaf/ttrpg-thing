import { Collapsible } from "@base-ui-components/react"
import { type } from "arktype"
import type { ReactNode } from "react"
import { useLocalStorage } from "../../common/local-storage.ts"
import type { Falsy } from "../../common/types.ts"
import { Button } from "../../ui/Button.tsx"
import { Icon, type Iconish } from "../../ui/Icon.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../../ui/Menu.tsx"

type ToggleSectionAction = {
	name: string
	icon: Iconish
} & (
	| {
			callback: () => unknown
	  }
	| {
			options: {
				name: string
				icon: Iconish
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
	const [open, setOpen] = useLocalStorage({
		key: `AssetListToggleSection:${name}:open`,
		fallback: false,
		schema: type("boolean"),
	})

	return (
		<Collapsible.Root className="isolate" open={open} onOpenChange={setOpen}>
			<div className="sticky top-0 z-10 flex items-center">
				<Collapsible.Trigger className="group flex w-full items-center gap-2 bg-gray-900/75 p-3 text-left backdrop-blur transition-colors hover:bg-gray-800/75">
					<Icon
						icon="mingcute:right-fill"
						className="size-4 opacity-70 transition-transform group-data-panel-open:rotate-90"
					/>
					<div className="flex-1">
						<span className="text-sm font-medium">{name}</span>
						{subtext && (
							<span className="ml-2 text-xs opacity-50">{subtext}</span>
						)}
					</div>
				</Collapsible.Trigger>

				{actions && actions.length > 0 && (
					<div className="absolute right-0 z-20 flex gap-1 px-1.5 *:size-8">
						{actions.filter(Boolean).map((action) =>
							"callback" in action ? (
								<Button
									key={action.name}
									icon={action.icon}
									shape="square"
									size="sm"
									onClick={action.callback}
								>
									{action.name}
								</Button>
							) : (
								<Menu key={action.name}>
									<MenuButton
										render={
											<Button icon={action.icon} shape="square" size="sm">
												{action.name}
											</Button>
										}
									/>
									<MenuPanel>
										{action.options.map((option) => (
											<MenuItem
												key={option.name}
												icon={option.icon}
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

			<Collapsible.Panel>{children}</Collapsible.Panel>
		</Collapsible.Root>
	)
}
