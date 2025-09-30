import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { vec } from "../../common/vec.ts"
import { Portal } from "../../ui/Portal.tsx"

type AssetImportPreset = (typeof IMPORT_PRESETS)[number]
const IMPORT_PRESETS = [
	{ name: "Tile", size: vec(100, 100) },
	{ name: "Portrait", size: vec(200, 300) },
	{ name: "Scene", size: vec(1600, 900) },
]

export function AssetDropOverlay({
	visible,
	onDrop,
}: {
	visible: boolean
	onDrop: (preset: AssetImportPreset, files: File[]) => void
}) {
	return (
		<Portal>
			<div
				className="pointer-events-none fixed inset-0 flex-center-col gap-4 bg-black/50 opacity-0 backdrop-blur transition-all transition-discrete data-visible:pointer-events-auto data-visible:bg-black/50 data-visible:opacity-100"
				data-visible={visible || undefined}
			>
				<p className="text-2xl font-light">Import as...</p>
				<div className="flex-center flex flex-wrap items-center gap-8">
					{IMPORT_PRESETS.map((preset) => (
						<PresetDropTarget
							key={preset.name}
							preset={preset}
							onDrop={onDrop}
						/>
					))}
				</div>
			</div>
		</Portal>
	)
}

function PresetDropTarget({
	preset,
	onDrop,
}: {
	preset: AssetImportPreset
	onDrop: (preset: AssetImportPreset, files: File[]) => void
}) {
	const [isOver, setIsOver] = useState(false)
	return (
		<div
			key={preset.name}
			className="flex-center flex-col gap-2 rounded p-2 opacity-75 transition data-drag-over:bg-white/10 data-drag-over:opacity-100"
			data-drag-over={isOver || undefined}
			onDragOver={(event) => {
				event.preventDefault()
				setIsOver(true)
			}}
			onDragLeave={() => {
				setIsOver(false)
			}}
			onDrop={(event) => {
				event.preventDefault()
				setIsOver(false)
				onDrop(preset, Array.from(event.dataTransfer.files))
			}}
		>
			<div className="flex-center size-48">
				<div
					className={twMerge(
						"flex-center panel text-gray-500",
						preset.size.x > preset.size.y ? "w-full" : "h-full",
					)}
					style={{
						aspectRatio: `${preset.size.x}/${preset.size.y}`,
					}}
				>
					{preset.size.x}x{preset.size.y}
				</div>
			</div>
			<p>{preset.name}</p>
		</div>
	)
}
