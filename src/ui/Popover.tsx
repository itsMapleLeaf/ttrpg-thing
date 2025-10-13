import { Popover as BasePopover } from "@base-ui-components/react"
import { twMerge } from "tailwind-merge"

export const Popover = BasePopover.Root

export const PopoverButton = BasePopover.Trigger
export const PopoverClose = BasePopover.Close

export function PopoverPanel({
	children,
	className,
	side,
	align,
	gap = 8,
}: {
	children: React.ReactNode
	className?: string
	side?: BasePopover.Positioner.Props["side"]
	align?: BasePopover.Positioner.Props["align"]
	gap?: BasePopover.Positioner.Props["sideOffset"]
}) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner side={side} align={align} sideOffset={gap}>
				<BasePopover.Popup
					className={twMerge(
						"base-ui-fade-rise-transition panel shadow-md",
						className,
					)}
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	)
}
