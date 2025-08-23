import { Iconish, type IconishIcon } from "./Iconish.tsx"

export function EmptyState({
	icon,
	message,
}: {
	icon: IconishIcon
	message: string
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
			<Iconish icon={icon} className="size-12 opacity-50" />
			<p className="text-lg font-medium text-gray-500">{message}</p>
		</div>
	)
}
