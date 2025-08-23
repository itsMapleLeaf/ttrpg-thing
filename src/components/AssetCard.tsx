import { Icon } from "@iconify/react"
import { twMerge } from "tailwind-merge"
import { SmartImage } from "../ui/SmartImage.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"

export function AssetCard({
	name,
	imageUrl,
	imageWrapperClass,
	selected,
	onChangeSelected,
	onChangeName,
}: {
	name: string
	imageUrl: string | null | undefined
	imageWrapperClass?: string
	selected: boolean
	onChangeSelected: (selected: boolean) => void
	onChangeName: (name: string) => unknown
}) {
	return (
		<div className="w-full panel bg-gray-950/40 outline-2 outline-transparent transition-colors">
			<label
				className={twMerge(
					"group relative block select-none",
					imageWrapperClass,
				)}
			>
				{imageUrl ? (
					<SmartImage
						src={imageUrl}
						alt=""
						className="size-full object-cover object-top"
					/>
				) : (
					<div className="flex-center h-full">
						<Icon
							icon="mingcute:file-unknown-line"
							className="size-12 opacity-50"
						/>
					</div>
				)}

				<div
					className="absolute right-0 bottom-0 block p-2 opacity-0 transition-opacity group-hover:opacity-100 data-selected:opacity-100"
					data-selected={selected || undefined}
				>
					<div className="sr-only">Selected</div>
					<input
						type="checkbox"
						className="block size-5 accent-primary-400"
						checked={selected}
						onChange={(event) => onChangeSelected(event.target.checked)}
					/>
				</div>

				<div
					className="pointer-events-none absolute inset-0 bg-primary-400/25 opacity-0 transition-opacity data-visible:opacity-100"
					data-visible={selected || undefined}
				/>
			</label>

			<WithTooltip content={name} positionerProps={{ side: "bottom" }}>
				<button
					type="button"
					className="group flex h-6.5 w-full items-center justify-center gap-1 px-2 text-xs/tight font-semibold hover:bg-gray-800"
					onClick={() => {
						const newName = prompt("New name?", name)?.trim()
						if (!newName) return

						onChangeName(newName)
					}}
				>
					<div className="truncate">{name}</div>
					<div className="flex h-4 w-0 justify-center transition-[width] group-hover:w-4">
						<Icon
							icon="mingcute:pencil-fill"
							className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
						/>
					</div>
				</button>
			</WithTooltip>
		</div>
	)
}
