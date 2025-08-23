import { Iconish, type IconishIcon } from "./Iconish.tsx"

export function EmptyState({
	icon,
	message,
}: {
	icon: IconishIcon
	message: string
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
			<div className="size-12 opacity-50">
				<Iconish icon={icon} className="size-full" />
			</div>
			<p className="text-lg font-medium text-gray-500">{message}</p>
		</div>
	)
}
