import { ContextMenu as BaseContextMenu } from "@base-ui-components/react"
import { Icon } from "@iconify/react/dist/iconify.js"
import type { ReactElement } from "react"
import { twMerge } from "tailwind-merge"

export const ContextMenu = BaseContextMenu.Root

export const ContextMenuTrigger = BaseContextMenu.Trigger

export function ContextMenuPanel({
	children,
	positionerProps,
}: {
	children: React.ReactNode
	positionerProps?: BaseContextMenu.Positioner.Props
}) {
	return (
		<BaseContextMenu.Portal>
			<BaseContextMenu.Positioner sideOffset={8} {...positionerProps}>
				<BaseContextMenu.Popup className="base-ui-fade-rise-transition panel shadow-md">
					{children}
				</BaseContextMenu.Popup>
			</BaseContextMenu.Positioner>
		</BaseContextMenu.Portal>
	)
}

export function ContextMenuItem({
	icon,
	className,
	children,
	...props
}: BaseContextMenu.Item.Props & {
	icon?: string | ReactElement
}) {
	return (
		<BaseContextMenu.Item
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
		</BaseContextMenu.Item>
	)
}
