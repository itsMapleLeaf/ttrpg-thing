import { Menu as BaseMenu } from "@base-ui-components/react"
import { Icon } from "@iconify/react/dist/iconify.js"
import type { ReactElement } from "react"
import { twMerge } from "tailwind-merge"

export const Menu = BaseMenu.Root

export const MenuButton = BaseMenu.Trigger

export function MenuPanel({
	children,
	positionerProps,
}: {
	children: React.ReactNode
	positionerProps?: BaseMenu.Positioner.Props
}) {
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner sideOffset={8} {...positionerProps}>
				<BaseMenu.Popup className="panel">{children}</BaseMenu.Popup>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	)
}

export function MenuItem({
	icon,
	className,
	children,
	...props
}: BaseMenu.Item.Props & {
	icon?: string | ReactElement
}) {
	return (
		<BaseMenu.Item
			{...props}
			className={(state) =>
				twMerge(
					"button-clear justify-start rounded-none text-start hover:border-transparent",
					typeof className === "string" ? className : className?.(state),
				)
			}
		>
			{typeof icon === "string" ? <Icon icon={icon} /> : icon}
			{children}
		</BaseMenu.Item>
	)
}
