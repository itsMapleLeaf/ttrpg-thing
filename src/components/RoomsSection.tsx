import { Collapsible } from "@base-ui-components/react"
import { Icon } from "@iconify/react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { api } from "../../convex/_generated/api.js"

export function RoomsSection() {
	const rooms = useQuery(api.rooms.list) ?? []

	return (
		<Collapsible.Root defaultOpen>
			<div className="grid gap-2">
				<Collapsible.Trigger className="group sidebar-link">
					<Icon
						icon="mingcute:right-fill"
						className="size-4 transition-transform group-data-panel-open:rotate-90"
					/>
					Rooms
				</Collapsible.Trigger>
				<Collapsible.Panel className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
					<div className="grid gap-2">
						{rooms.length === 0 ? (
							<p className="px-2 py-1 text-sm opacity-70">No rooms yet</p>
						) : (
							rooms.map((room) => (
								<Link
									key={room._id}
									to="/rooms/$slug"
									params={{ slug: room.slug }}
									className="sidebar-link flex py-1"
								>
									<Icon icon="mingcute:open-door-fill" />
									<div>
										<div className="text-sm">{room.name}</div>
										<div className="text-xs opacity-70">
											{formatDistanceToNow(room._creationTime, {
												addSuffix: true,
											})}
										</div>
									</div>
								</Link>
							))
						)}
					</div>
				</Collapsible.Panel>
			</div>
		</Collapsible.Root>
	)
}
