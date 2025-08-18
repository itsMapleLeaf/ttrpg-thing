import { Popover as BasePopover } from "@base-ui-components/react"

export const Popover = BasePopover.Root

export const PopoverButton = BasePopover.Trigger

export function PopoverPanel({
	children,
	positionerProps,
}: {
	children: React.ReactNode
	positionerProps?: BasePopover.Positioner.Props
}) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner sideOffset={8} {...positionerProps}>
				<BasePopover.Popup className="base-ui-fade-rise-transition panel shadow-md">
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	)
}
