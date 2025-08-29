import { Icon, type Iconish } from "./Icon.tsx"

export function EmptyState({
	icon,
	message,
}: {
	icon: Iconish
	message: string
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
			<Icon icon={icon} className="size-12 opacity-50" />
			<p className="text-lg font-medium text-gray-500">{message}</p>
		</div>
	)
}
