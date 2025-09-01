import { ScrollArea as BaseScrollArea } from "@base-ui-components/react/scroll-area"
import type { ComponentProps } from "react"

export function ScrollArea({
	children,
	orientation = "vertical",
	...props
}: ComponentProps<typeof BaseScrollArea.Root> & {
	orientation?: "horizontal" | "vertical"
}) {
	return (
		<BaseScrollArea.Root {...props}>
			<BaseScrollArea.Viewport className="h-full overscroll-contain">
				{children}
			</BaseScrollArea.Viewport>
			<BaseScrollArea.Scrollbar
				className="p-0.5 opacity-0 transition-opacity data-hovering:opacity-100 data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2"
				orientation={orientation}
			>
				<BaseScrollArea.Thumb className="rounded bg-gray-700 transition-colors active:bg-primary-900 data-[orientation=horizontal]:h-full" />
			</BaseScrollArea.Scrollbar>
		</BaseScrollArea.Root>
	)
}
