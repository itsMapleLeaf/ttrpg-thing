import { Collapsible } from "@base-ui-components/react"
import { Link, type LinkProps } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import { Button } from "../../ui/Button.tsx"
import { Icon } from "../../ui/Icon.tsx"

interface SidebarSectionProps {
	title: string
	addButtonLink: LinkProps["to"]
	children: ReactNode
	defaultOpen?: boolean
}

export function SidebarToggleSection({
	title,
	addButtonLink,
	children,
	defaultOpen = true,
}: SidebarSectionProps) {
	return (
		<Collapsible.Root defaultOpen={defaultOpen}>
			<div className="grid gap-2">
				<div className="flex items-center gap-2">
					<Collapsible.Trigger className="group sidebar-link flex-1">
						<Icon
							icon="mingcute:right-fill"
							className="size-4 transition-transform group-data-panel-open:rotate-90"
						/>
						<div className="flex-1">{title}</div>
					</Collapsible.Trigger>
					<Link to={addButtonLink}>
						<Button
							icon="mingcute:add-fill"
							appearance="clear"
							shape="square"
							size="sm"
						>
							Add {title.toLowerCase().slice(0, -1)}
						</Button>
					</Link>
				</div>
				<Collapsible.Panel className="grid gap-2">{children}</Collapsible.Panel>
			</div>
		</Collapsible.Root>
	)
}

interface SidebarToggleLinkProps extends LinkProps {
	icon: string
	name: string
	createdAt: number
	className?: string
}

SidebarToggleSection.Link = function SidebarToggleSectionLink({
	to,
	params,
	icon,
	name,
	createdAt,
	className = "",
}: SidebarToggleLinkProps) {
	return (
		<Link
			to={to}
			params={params}
			className={twMerge("sidebar-link flex py-1", className)}
		>
			<Icon icon={icon} className="size-4" />
			<div className="flex-1">
				<div className="truncate text-sm">{name}</div>
				<div className="text-xs opacity-70">
					{formatDistanceToNow(createdAt, { addSuffix: true })}
				</div>
			</div>
		</Link>
	)
}
