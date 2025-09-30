import { useState } from "react"
import { typedEntries } from "../../common/helpers.ts"
import { Icon } from "../../ui/Icon.tsx"
import { ScrollArea } from "../../ui/ScrollArea.tsx"
import { WithTooltip } from "../../ui/Tooltip.tsx"

export type ToolId = keyof typeof toolbarTools
const toolbarTools = {
	select: {
		name: "Select",
		icon: "mingcute:cursor-fill",
	},
	pan: {
		name: "Pan",
		icon: "mingcute:hand-fill",
	},
	newLabel: {
		name: "New Label",
		icon: "mingcute:text-fill",
	},
}

type ToolbarState = ReturnType<typeof useToolbarState>
export function useToolbarState() {
	const [selectedToolId, setSelectedToolId] = useState<ToolId>("select")
	return { selectedToolId, setSelectedToolId }
}

export function SurfaceToolbar({
	selectedToolId,
	setSelectedToolId,
}: ToolbarState) {
	return (
		<ScrollArea className="max-w-full panel" orientation="horizontal">
			<div className="flex gap-1 p-1">
				{typedEntries(toolbarTools).map(([key, tool]) => (
					<SurfaceToolbarItem
						key={key}
						icon={tool.icon}
						label={tool.name}
						selected={selectedToolId === key}
						onClick={() => setSelectedToolId(key)}
					/>
				))}
			</div>
		</ScrollArea>
	)
}

function SurfaceToolbarItem({
	icon,
	label,
	selected,
	onClick,
}: {
	icon: string
	label: string
	selected: boolean
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
	return (
		<WithTooltip content={label}>
			<button
				type="button"
				data-selected={selected}
				className="flex-center size-8 rounded transition hover:bg-gray-700 data-[selected=true]:bg-primary-700/30 data-[selected=true]:text-primary-300"
				onClick={onClick}
			>
				<Icon icon={icon} className="size-5" />
				<span className="sr-only">{label}</span>
			</button>
		</WithTooltip>
	)
}
