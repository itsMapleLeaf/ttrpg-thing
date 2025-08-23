import { Tooltip as BaseTooltip } from "@base-ui-components/react"

export interface WithTooltipProps {
	children: React.ReactElement<Record<string, unknown>>
	content: React.ReactNode
	positionerProps?: BaseTooltip.Positioner.Props
}

export function WithTooltip({
	children,
	content,
	positionerProps,
}: WithTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger render={children} />
			<TooltipContent positionerProps={positionerProps}>
				{content}
			</TooltipContent>
		</Tooltip>
	)
}

export function Tooltip(props: BaseTooltip.Root.Props) {
	return <BaseTooltip.Root delay={200} hoverable={false} {...props} />
}

export const TooltipTrigger = BaseTooltip.Trigger

export function TooltipContent({
	children,
	positionerProps,
}: {
	children: React.ReactNode
	positionerProps?: BaseTooltip.Positioner.Props
}) {
	return (
		<BaseTooltip.Portal>
			<BaseTooltip.Positioner sideOffset={4} {...positionerProps}>
				<BaseTooltip.Popup className="max-w-64 base-ui-fade-rise-transition panel rounded px-2 py-1 text-center text-sm/snug font-semibold text-balance whitespace-pre-line shadow-md">
					{children}
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Portal>
	)
}
