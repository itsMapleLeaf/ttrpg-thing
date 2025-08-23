import { ScrollArea as BaseScrollArea } from "@base-ui-components/react/scroll-area"
import type { ComponentProps } from "react"

export function ScrollArea({
	children,
	...props
}: ComponentProps<typeof BaseScrollArea.Root>) {
	return (
		<BaseScrollArea.Root {...props}>
			<BaseScrollArea.Viewport className="h-full overscroll-contain pr-2">
				{children}
			</BaseScrollArea.Viewport>
			<BaseScrollArea.Scrollbar className="w-2 rounded-full">
				<BaseScrollArea.Thumb className="h-[--scroll-area-thumb-height] w-full bg-gray-700/50 transition-colors active:bg-primary-900" />
			</BaseScrollArea.Scrollbar>
		</BaseScrollArea.Root>
	)
}
